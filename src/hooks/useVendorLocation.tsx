import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface VendorLocation {
  id: string;
  user_id: string;
  label: string;
  category: string | null;
  island: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  is_active: boolean;
  is_mobile: boolean;
  address: string | null;
  expires_at: string;
  last_seen_at: string;
}

interface ShareOptions {
  label: string;
  category?: string;
  island?: string;
  durationMinutes: number; // 15..720
  isMobile: boolean;       // true = ambulant (live tracking), false = fixe
  address?: string;        // pour position fixe
}

const STORAGE_KEY = 'ujamaan_vendor_location_id';

export const useVendorLocation = () => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isMobileActive, setIsMobileActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<any>(null);
  const activeIdRef = useRef<string | null>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      // @ts-ignore - wakeLock exists on modern browsers
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener?.('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch (e) {
      logger.warn('wake lock unavailable', e);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release?.();
    } catch {}
    wakeLockRef.current = null;
  }, []);

  const pushPosition = useCallback(async (locationId: string, pos: GeolocationPosition) => {
    try {
      await supabase
        .from('vendor_locations')
        .update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          heading: pos.coords.heading ?? null,
          speed: pos.coords.speed ?? null,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', locationId);
    } catch (e) {
      logger.error('update vendor position failed', e);
    }
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    releaseWakeLock();
  }, [releaseWakeLock]);

  const startWatching = useCallback((locationId: string) => {
    if (!('geolocation' in navigator)) return;
    stopWatching();
    activeIdRef.current = locationId;

    // 1) Continuous watch (fires when device detects movement)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => pushPosition(locationId, pos),
      (err) => logger.error('geolocation watch error', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    );

    // 2) Heartbeat: force a fresh GPS fix every 15s so the marker keeps moving
    //    even if watchPosition is throttled by the browser.
    heartbeatRef.current = setInterval(() => {
      if (!activeIdRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => pushPosition(activeIdRef.current!, pos),
        (err) => logger.warn('heartbeat geolocation error', err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    }, 15000);

    // 3) Keep the screen awake while ambulant sharing is active
    requestWakeLock();
  }, [stopWatching, pushPosition, requestWakeLock]);

  // Re-acquire wake lock + force a fix when the tab becomes visible again
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && activeIdRef.current) {
        requestWakeLock();
        navigator.geolocation?.getCurrentPosition(
          (pos) => pushPosition(activeIdRef.current!, pos),
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
        );
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [requestWakeLock, pushPosition]);

  // Restore session
  useEffect(() => {
    if (!user) return;
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const { data } = await supabase
          .from('vendor_locations')
          .select('id, expires_at, is_active, is_mobile')
          .eq('id', stored)
          .eq('user_id', user.id)
          .maybeSingle();
        if (data && data.is_active && new Date(data.expires_at) > new Date()) {
          setActiveId(data.id);
          setExpiresAt(new Date(data.expires_at));
          setIsMobileActive(!!data.is_mobile);
          // Only watch if mobile/ambulant
          if (data.is_mobile) startWatching(data.id);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        logger.error('restore vendor location failed', e);
      }
    };
    restoreSession();
    return () => stopWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startSharing = useCallback(async (opts: ShareOptions) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }
    if (!('geolocation' in navigator)) {
      toast.error('Géolocalisation non disponible sur cet appareil');
      return false;
    }
    setIsSharing(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
        });
      });

      const expires = new Date(Date.now() + opts.durationMinutes * 60 * 1000);

      const { data, error } = await supabase
        .from('vendor_locations')
        .insert({
          user_id: user.id,
          label: opts.label,
          category: opts.category || null,
          island: opts.island || null,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          heading: pos.coords.heading ?? null,
          speed: pos.coords.speed ?? null,
          is_active: true,
          is_mobile: opts.isMobile,
          address: opts.address || null,
          expires_at: expires.toISOString(),
        })
        .select('id, expires_at, is_mobile')
        .single();

      if (error) throw error;
      setActiveId(data.id);
      setExpiresAt(new Date(data.expires_at));
      setIsMobileActive(!!data.is_mobile);
      localStorage.setItem(STORAGE_KEY, data.id);
      // Live tracking only for ambulant
      if (opts.isMobile) startWatching(data.id);
      toast.success(opts.isMobile ? 'Position partagée en direct ✅' : 'Position fixe enregistrée ✅');
      return true;
    } catch (e: any) {
      logger.error('start sharing failed', e);
      toast.error(e?.message || 'Impossible de partager la position');
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [user, startWatching]);

  const stopSharing = useCallback(async () => {
    if (!activeId) return;
    try {
      await supabase
        .from('vendor_locations')
        .update({ is_active: false, expires_at: new Date().toISOString() })
        .eq('id', activeId);
      stopWatching();
      activeIdRef.current = null;
      localStorage.removeItem(STORAGE_KEY);
      setActiveId(null);
      setExpiresAt(null);
      setIsMobileActive(false);
      toast.success('Partage de position arrêté');
    } catch (e) {
      logger.error('stop sharing failed', e);
    }
  }, [activeId, stopWatching]);

  return { activeId, isSharing, expiresAt, isActive: !!activeId, isMobileActive, startSharing, stopSharing };
};

export const useLiveVendorLocations = (island?: string) => {
  const [locations, setLocations] = useState<VendorLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      let q = supabase
        .from('vendor_locations')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());
      if (island) q = q.eq('island', island);
      const { data, error } = await q.order('last_seen_at', { ascending: false });
      if (!mounted) return;
      if (error) logger.error('load vendor locations failed', error);
      setLocations((data as VendorLocation[]) || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('vendor_locations_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_locations' }, () => {
        load();
      })
      .subscribe();

    const interval = setInterval(load, 60000);

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [island]);

  return { locations, loading };
};
