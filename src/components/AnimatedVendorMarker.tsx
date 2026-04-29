import { useEffect, useRef, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  id: string;
  position: [number, number];
  icon: L.DivIcon | L.Icon;
  follow?: boolean;
  /** Animation duration in ms (matches typical update interval) */
  durationMs?: number;
  children?: React.ReactNode;
  onClick?: () => void;
}

/**
 * Marker that smoothly animates between position updates using requestAnimationFrame.
 * If `follow` is true, the map pans to keep the marker centered after each move.
 */
export default function AnimatedVendorMarker({
  position,
  icon,
  follow = false,
  durationMs = 1500,
  children,
  onClick,
}: Props) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const rafRef = useRef<number | null>(null);
  const [displayPos, setDisplayPos] = useState<[number, number]>(position);
  const fromRef = useRef<[number, number]>(position);
  const toRef = useRef<[number, number]>(position);
  const startRef = useRef<number>(0);

  useEffect(() => {
    // If position barely changed, skip animation
    const [lat0, lng0] = displayPos;
    const [lat1, lng1] = position;
    const dist = Math.hypot(lat1 - lat0, lng1 - lng0);
    if (dist < 0.000001) return;

    fromRef.current = displayPos;
    toRef.current = position;
    startRef.current = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / durationMs);
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);
      const lat = fromRef.current[0] + (toRef.current[0] - fromRef.current[0]) * e;
      const lng = fromRef.current[1] + (toRef.current[1] - fromRef.current[1]) * e;
      setDisplayPos([lat, lng]);
      if (follow) {
        map.panTo([lat, lng], { animate: false });
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1], follow]);

  return (
    <Marker
      ref={markerRef}
      position={displayPos}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(),
      }}
    >
      {children}
    </Marker>
  );
}
