import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

// Hash API key using Web Crypto
async function hashKey(key: string): Promise<string> {
  const enc = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface ApiKeyInfo {
  id: string;
  permissions: string[];
  created_by: string;
}

async function validateApiKey(
  supabase: ReturnType<typeof createClient>,
  apiKey: string
): Promise<ApiKeyInfo | null> {
  const keyHash = await hashKey(apiKey);
  const { data, error } = await supabase.rpc("validate_api_key", {
    _key_hash: keyHash,
  });
  if (error || !data || data.length === 0) return null;
  // Record usage (fire and forget)
  supabase.rpc("record_api_key_usage", { _key_id: data[0].id }).then();
  return data[0] as ApiKeyInfo;
}

function hasPermission(key: ApiKeyInfo, perm: string): boolean {
  return key.permissions.includes("admin") || key.permissions.includes(perm);
}

// Route parser
function parseRoute(url: URL): { resource: string; id?: string; sub?: string } {
  const path = url.pathname.replace(/^\/mobile-api\/?/, "");
  const parts = path.split("/").filter(Boolean);
  return { resource: parts[0] || "", id: parts[1], sub: parts[2] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/mobile-api\/?/, "");

  // ── UNAUTHENTICATED UTILITY ENDPOINTS ──
  // /openapi.json : machine-readable spec (no key required, but route is referenced
  // only from the protected /api-docs page, so it stays effectively private).
  if (path === "openapi.json" && req.method === "GET") {
    return json(buildOpenApiSpec(), 200);
  }
  // /warmup : called by pg_cron every 5 min to keep AI knowledge cache hot.
  if (path === "warmup" && (req.method === "GET" || req.method === "POST")) {
    fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({ message: "__warmup__", sessionId: "warmup-cron", warmupOnly: true }),
    }).catch((e) => console.error("warmup error", e));
    return json({ ok: true, warmedAt: new Date().toISOString() });
  }

  // Extract API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return err("Missing x-api-key header", 401);
  }

  const keyInfo = await validateApiKey(supabase, apiKey);
  if (!keyInfo) {
    return err("Invalid or expired API key", 401);
  }

  let { resource, id, sub } = parseRoute(url);
  const method = req.method;

  // Aliases publics (cohérence externe) → routent vers les implémentations existantes
  // /investment       → /diaspora
  // /investment-action → /diaspora-action
  if (resource === "investment") resource = "diaspora";
  else if (resource === "investment-action") resource = "diaspora-action";

  try {
    // ── PUBLIC ENDPOINT: AI CHAT (login permission, no admin) ──
    if (resource === "ai-chat" && method === "POST") {
      if (!hasPermission(keyInfo, "login")) return err("Permission denied", 403);
      const body = await req.json();
      const { message, sessionId } = body;
      if (!message || !sessionId) return err("message and sessionId required");

      // Forward authorization (optional bearer for personalized AI history)
      const authHeader = req.headers.get("authorization") || "";
      const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
          apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        },
        body: JSON.stringify({ message, sessionId, clientHistory: body.clientHistory || [] }),
      });
      const aiData = await aiRes.json();
      return json(aiData, aiRes.status);
    }

    // ── PUBLIC ENDPOINT: PUBLIC CONTENT (no login needed beyond key) ──
    if (resource === "public" && method === "GET") {
      // Allows mobile app to fetch public listings without admin permission
      if (!hasPermission(keyInfo, "login") && !hasPermission(keyInfo, "admin")) return err("Permission denied", 403);
      // Alias : fundraising = diaspora (levée de fonds = projets investissement)
      const sub = (id === "fundraising" ? "diaspora" : id) as string | undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const tableMap: Record<string, string> = {
        prices: "prices", events: "events", content: "content_items",
        gastronomy: "gastronomy_items", freelancers: "freelancer_profiles", diaspora: "investments",
        "vendor-locations": "vendor_locations",
        enterprises: "enterprise_profiles_public",
        partners: "partner_accounts",
      };
      const table = tableMap[sub || ""];
      if (!table) return err("Unknown public resource", 404);
      let q = supabase.from(table).select("*", { count: "exact" });
      if (table === "freelancer_profiles") q = q.eq("is_visible", true);
      else if (table === "vendor_locations") q = q.eq("is_active", true);
      else if (table === "enterprise_profiles_public") { /* pas de status */ }
      else if (table === "partner_accounts") q = q.eq("status", "active");
      else q = q.eq("status", "published");
      const orderCol = table === "vendor_locations" ? "last_seen_at" : "created_at";
      const { data, count, error: qErr } = await q.range(offset, offset + limit - 1).order(orderCol, { ascending: false });
      if (qErr) return err(qErr.message, 500);

      // ── Enrichissement auteur (batch) ──
      const rawAuthorIds = (data || []).map((r: any) => r.author_id || r.user_id).filter(Boolean);
      const authorIds = Array.from(new Set(rawAuthorIds));
      const authorsMap = new Map<string, any>();
      if (authorIds.length) {
        const { data: usersRows } = await supabase
          .from("users").select("id, username, avatar_url, account_type")
          .in("id", authorIds);
        (usersRows || []).forEach((u: any) => authorsMap.set(u.id, u));
      }

      // ── Normalisation PublicListing ──
      const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public`;
      const toAbsImg = (v: string | null | undefined): string | null => {
        if (!v) return null;
        if (v.startsWith("http://") || v.startsWith("https://")) return v;
        return `${STORAGE_BASE}/${v.replace(/^\/+/, "")}`;
      };
      const buildImages = (row: any, candidates: string[]): string[] => {
        const out: string[] = [];
        for (const k of candidates) {
          const v = row[k];
          if (Array.isArray(v)) v.forEach((x) => { const a = toAbsImg(x); if (a) out.push(a); });
          else if (v) { const a = toAbsImg(v); if (a) out.push(a); }
        }
        return Array.from(new Set(out));
      };
      const normalize = (row: any) => {
        const authorId = row.author_id || row.user_id || null;
        const u = authorId ? authorsMap.get(authorId) : null;
        let title = row.title || row.product || row.name || row.display_name || row.label || "";
        let subtitle: string | null = null;
        const extra: Record<string, any> = {};
        let images: string[] = [];

        switch (table) {
          case "prices":
            subtitle = [row.vendor, row.market, row.city].filter(Boolean).join(" · ") || null;
            images = buildImages(row, ["image_url"]);
            extra.price = row.price; extra.currency = row.currency; extra.unit = row.unit;
            extra.vendor = row.vendor; extra.market = row.market; extra.village = row.village; extra.region = row.region;
            extra.merchant_type = row.merchant_type; extra.trend = row.trend;
            break;
          case "events":
            images = buildImages(row, ["images"]);
            extra.date = row.date; extra.end_date = row.end_date; extra.organizer = row.organizer;
            extra.price = row.price; extra.currency = row.currency; extra.capacity = row.capacity;
            extra.registered_count = row.registered_count; extra.requires_registration = row.requires_registration;
            break;
          case "content_items":
            extra.type = row.type;
            images = buildImages(row, ["image_url", "images"]);
            break;
          case "gastronomy_items":
            images = buildImages(row, ["images"]);
            extra.price_min = row.price_min; extra.price_max = row.price_max;
            extra.dining_style = row.dining_style; extra.accommodation_type = row.accommodation_type;
            extra.room_types = row.room_types; extra.service_mode = row.service_mode;
            break;
          case "freelancer_profiles":
            images = buildImages(row, ["avatar_url"]);
            extra.skills = row.skills; extra.hourly_rate_min = row.hourly_rate_min;
            extra.hourly_rate_max = row.hourly_rate_max; extra.currency = row.currency;
            extra.experience_years = row.experience_years; extra.is_available = row.is_available;
            extra.facebook_url = row.facebook_url; extra.linkedin_url = row.linkedin_url;
            extra.twitter_url = row.twitter_url; extra.instagram_url = row.instagram_url;
            break;
          case "investments":
            images = buildImages(row, ["images"]);
            extra.target_amount = row.target_amount; extra.current_amount = row.current_amount;
            extra.currency = row.currency; extra.deadline = row.deadline;
            extra.min_investment = row.min_investment;
            extra.progress_pct = row.target_amount > 0
              ? Math.round((Number(row.current_amount || 0) / Number(row.target_amount)) * 100)
              : null;
            break;
          case "enterprise_profiles_public":
            images = buildImages(row, ["logo_url"]);
            extra.sector = row.sector; extra.is_verified = row.is_verified;
            break;
          case "vendor_locations":
            extra.accuracy = row.accuracy; extra.heading = row.heading; extra.speed = row.speed;
            extra.is_mobile = row.is_mobile; extra.is_active = row.is_active;
            extra.last_seen_at = row.last_seen_at;
            title = row.label || "";
            subtitle = row.address || row.location || null;
            break;
          case "partner_accounts":
            images = buildImages(row, ["logo_url"]);
            break;
        }

        const phone = row.contact_phone ?? row.phone ?? null;
        const whatsapp = row.contact_whatsapp ?? row.whatsapp ?? null;
        const email = row.contact_email ?? row.email ?? null;
        const website = row.website ?? row.portfolio_url ?? null;
        const cover_url = images[0] || null;

        return {
          id: row.id,
          resource: sub,
          title,
          subtitle,
          description: row.description ?? null,
          category: row.category ?? null,
          island: row.island ?? null,
          city: row.city ?? row.location ?? null,
          phone, whatsapp, email, website,
          images, cover_url,
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
          author_id: authorId,
          author: u ? {
            id: u.id,
            display_name: u.username || null,
            avatar_url: u.avatar_url || null,
            account_type: u.account_type || "free",
            is_verified: false, // TODO enrichir via RPC is_verified_user
            role: "user",
          } : null,
          views: row.views ?? null,
          status: row.status ?? null,
          created_at: row.created_at ?? null,
          updated_at: row.updated_at ?? null,
          ...extra,
        };
      };

      const normalized = (data || []).map(normalize);
      return json({ data: normalized, total: count, limit, offset });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helper : récupère l'utilisateur connecté à partir du Bearer token.
    // Retourne null si absent/invalide.
    // ─────────────────────────────────────────────────────────────────────
    const getBearerUser = async () => {
      const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!bearer) return null;
      const { data, error } = await supabase.auth.getUser(bearer);
      if (error || !data?.user) return null;
      return data.user;
    };

    // ── PUBLIC ENDPOINT: AUTH ──
    if (resource === "auth" && method === "POST") {
      if (!hasPermission(keyInfo, "login")) return err("Permission denied", 403);

      if (id === "register") {
        const body = await req.json();
        const { email, password, username } = body;
        if (!email || !password) return err("email and password required");
        const { data, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username || email.split("@")[0] } },
        });
        if (authErr) return err(authErr.message, 400);
        return json({
          user_id: data.user?.id,
          email: data.user?.email,
          needs_email_confirmation: !data.session,
          access_token: data.session?.access_token || null,
          refresh_token: data.session?.refresh_token || null,
        }, 201);
      }

      if (id === "logout") {
        const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!bearer) return err("Authorization bearer required", 401);
        const { error: e } = await supabase.auth.admin.signOut(bearer);
        if (e) return err(e.message, 400);
        return json({ success: true });
      }

      if (id === "reset-password") {
        const body = await req.json();
        if (!body.email) return err("email required");
        const redirectTo = body.redirectTo || "https://ujamaan.com/reset-password";
        const { error: e } = await supabase.auth.resetPasswordForEmail(body.email, { redirectTo });
        if (e) return err(e.message, 400);
        return json({ success: true });
      }

      if (id === "login") {
        const body = await req.json();
        const { email, password } = body;
        if (!email || !password) return err("email and password required");

        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) return err(authErr.message, 401);

        // Fetch user profile
        const { data: profile } = await supabase
          .from("users")
          .select("id, username, email, avatar_url, bio, account_type")
          .eq("id", data.user.id)
          .single();

        // Fetch user role
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });

        return json({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.user.id,
            email: data.user.email,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            bio: profile?.bio,
            account_type: profile?.account_type,
            role: roleData || "user",
          },
        });
      }

      if (id === "refresh") {
        const body = await req.json();
        if (!body.refresh_token) return err("refresh_token required");
        const { data, error: authErr } = await supabase.auth.refreshSession({ refresh_token: body.refresh_token });
        if (authErr) return err(authErr.message, 401);
        return json({
          access_token: data.session!.access_token,
          refresh_token: data.session!.refresh_token,
          expires_at: data.session!.expires_at,
        });
      }

      if (id === "me") {
        // Get user from bearer token
        const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!bearer) return err("Authorization bearer required", 401);
        const { data: { user }, error: userErr } = await supabase.auth.getUser(bearer);
        if (userErr || !user) return err("Invalid token", 401);

        const { data: profile } = await supabase
          .from("users")
          .select("id, username, email, avatar_url, bio, account_type")
          .eq("id", user.id)
          .single();

        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: user.id });

        return json({
          id: user.id,
          email: user.email,
          username: profile?.username,
          avatar_url: profile?.avatar_url,
          bio: profile?.bio,
          account_type: profile?.account_type,
          role: roleData || "user",
        });
      }

      return err("Unknown auth endpoint", 404);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ROUTES UTILISATEUR (permission "login" + Bearer token)
    // Couvrent toutes les actions du frontend public/connecté SAUF /admin/*
    // ═══════════════════════════════════════════════════════════════════════
    const requireUser = async () => {
      if (!hasPermission(keyInfo, "login")) {
        return { user: null, response: err("Permission denied", 403) };
      }
      const u = await getBearerUser();
      if (!u) return { user: null, response: err("Authorization bearer required", 401) };
      return { user: u, response: null as Response | null };
    };

    // ── PROFILE ──
    if (resource === "profile") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "GET") {
        const { data, error: e } = await supabase.from("users").select("*").eq("id", user!.id).single();
        if (e) return err(e.message, 404);
        return json(data);
      }
      if (method === "PUT") {
        const body = await req.json();
        const allowed = ["username", "bio", "avatar_url", "phone", "location", "website"];
        const patch: Record<string, unknown> = {};
        for (const k of allowed) if (k in body) patch[k] = body[k];
        const { data, error: e } = await supabase.from("users").update(patch).eq("id", user!.id).select().single();
        if (e) return err(e.message, 500);
        return json(data);
      }
      if (method === "DELETE") {
        const { error: e } = await supabase.from("pending_modifications").insert({
          type: "account_deletion", title: "Demande de suppression de compte",
          content: { user_id: user!.id, email: user!.email },
          submitted_by: user!.id, status: "pending",
        });
        if (e) return err(e.message, 500);
        return json({ success: true, message: "Demande enregistrée" });
      }
      return err("Method not allowed", 405);
    }

    // ── FAVORITES ──
    if (resource === "favorites") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "GET") {
        const { data, error: e } = await supabase.from("favorites").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
        if (e) return err(e.message, 500);
        return json({ data });
      }
      if (method === "POST") {
        const body = await req.json();
        if (!body.content_type || !body.content_id) return err("content_type and content_id required");
        const { data, error: e } = await supabase.from("favorites")
          .upsert({ user_id: user!.id, content_type: body.content_type, content_id: body.content_id }, { onConflict: "user_id,content_type,content_id" })
          .select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "DELETE" && id) {
        const { error: e } = await supabase.from("favorites").delete().eq("id", id).eq("user_id", user!.id);
        if (e) return err(e.message, 500);
        return json({ success: true });
      }
      return err("Method not allowed", 405);
    }

    // ── NOTIFICATIONS UTILISATEUR ──
    if (resource === "my-notifications") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "GET") {
        const { data, error: e } = await supabase.from("notifications")
          .select("*").or(`user_id.eq.${user!.id},user_id.is.null`)
          .order("created_at", { ascending: false }).limit(100);
        if (e) return err(e.message, 500);
        return json({ data });
      }
      if (method === "PUT" && id === "read-all") {
        const { error: e } = await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
        if (e) return err(e.message, 500);
        return json({ success: true });
      }
      if (method === "PUT" && id) {
        const { error: e } = await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user!.id);
        if (e) return err(e.message, 500);
        return json({ success: true });
      }
      return err("Method not allowed", 405);
    }

    // ── MESSAGES (privés 1:1, partagés avec le web) ──
    // Schéma: public.direct_messages(sender_id, receiver_id, content, is_read, created_at)
    // Routes:
    //  GET  /messages                        → liste de mes conversations (groupées par interlocuteur)
    //  GET  /messages/{partnerId}            → fil complet avec un interlocuteur (marque comme lu)
    //  GET  /messages/{partnerId}/since?ts=  → delta depuis ts ISO (sync incrémentale mobile)
    //  GET  /messages/unread-count           → nb total messages non lus
    //  POST /messages                        → { receiver_id, content, attachment? } envoyer un message
    //  POST /messages/{partnerId}/read       → marquer toute la conversation comme lue
    //  GET  /messages/with-freelancer/{freelancerUserId} → ouvre/charge le fil avec un freelancer (mission)
    if (resource === "messages") {
      const { user, response } = await requireUser();
      if (response) return response;
      const uid = user!.id;

      // GET /messages/unread-count
      if (method === "GET" && id === "unread-count") {
        const { count, error: e } = await supabase
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", uid)
          .eq("is_read", false);
        if (e) return err(e.message, 500);
        return json({ unread: count || 0 });
      }

      // GET /messages → conversations groupées
      if (method === "GET" && !id) {
        const { data, error: e } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
          .order("created_at", { ascending: false });
        if (e) return err(e.message, 500);

        const convMap = new Map<string, { messages: any[]; unread: number }>();
        for (const msg of data || []) {
          const partnerId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
          if (!convMap.has(partnerId)) convMap.set(partnerId, { messages: [], unread: 0 });
          const conv = convMap.get(partnerId)!;
          conv.messages.push(msg);
          if (!msg.is_read && msg.receiver_id === uid) conv.unread++;
        }
        const partnerIds = [...convMap.keys()];
        const { data: usernames } = await supabase.rpc("get_public_usernames", { _user_ids: partnerIds });
        const uMap = new Map<string, any>((usernames || []).map((u: any) => [u.id, u]));

        const conversations = partnerIds.map((pid) => {
          const c = convMap.get(pid)!;
          const last = c.messages[0];
          const u = uMap.get(pid);
          return {
            partner_id: pid,
            partner_username: u?.username || "Anonyme",
            partner_avatar_url: u?.avatar_url || null,
            last_message: last.content,
            last_message_at: last.created_at,
            last_sender_id: last.sender_id,
            unread_count: c.unread,
          };
        }).sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at));

        return json({ data: conversations });
      }

      // GET /messages/with-freelancer/{freelancerUserId} → ouvre le fil mission
      if (method === "GET" && id === "with-freelancer" && sub) {
        // sub = freelancer's user_id (pas profile id). Si on reçoit un profile id on résout.
        let partnerUserId = sub;
        const { data: prof } = await supabase
          .from("freelancer_profiles")
          .select("user_id")
          .eq("id", sub)
          .maybeSingle();
        if (prof?.user_id) partnerUserId = prof.user_id;

        const { data, error: e } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${uid},receiver_id.eq.${partnerUserId}),and(sender_id.eq.${partnerUserId},receiver_id.eq.${uid})`)
          .order("created_at", { ascending: true });
        if (e) return err(e.message, 500);
        return json({ partner_id: partnerUserId, data });
      }

      // POST /messages/{partnerId}/read
      if (method === "POST" && id && sub === "read") {
        const { error: e } = await supabase
          .from("direct_messages")
          .update({ is_read: true })
          .eq("receiver_id", uid)
          .eq("sender_id", id)
          .eq("is_read", false);
        if (e) return err(e.message, 500);
        return json({ ok: true });
      }

      // GET /messages/{partnerId}/since?ts=ISO
      if (method === "GET" && id && sub === "since") {
        const ts = url.searchParams.get("ts");
        if (!ts) return err("ts query param required (ISO timestamp)");
        const { data, error: e } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${uid},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${uid})`)
          .gt("created_at", ts)
          .order("created_at", { ascending: true });
        if (e) return err(e.message, 500);
        return json({ data, server_time: new Date().toISOString() });
      }

      // GET /messages/{partnerId} → fil complet + auto-mark-read
      if (method === "GET" && id && !sub) {
        const { data, error: e } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${uid},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${uid})`)
          .order("created_at", { ascending: true });
        if (e) return err(e.message, 500);

        const unreadIds = (data || []).filter((m: any) => m.receiver_id === uid && !m.is_read).map((m: any) => m.id);
        if (unreadIds.length) {
          await supabase.from("direct_messages").update({ is_read: true }).in("id", unreadIds);
        }
        return json({ data, server_time: new Date().toISOString() });
      }

      // POST /messages → envoyer
      if (method === "POST" && !id) {
        const body = await req.json();
        if (!body.receiver_id || !body.content?.trim()) {
          return err("receiver_id and content required");
        }
        if (body.receiver_id === uid) return err("Cannot message yourself");

        const { data, error: e } = await supabase.from("direct_messages").insert({
          sender_id: uid,
          receiver_id: body.receiver_id,
          content: body.content.trim(),
        }).select().single();
        if (e) return err(e.message, 500);

        // Pièce jointe optionnelle (URL déjà uploadée côté client sur bucket chat-attachments)
        if (body.attachment?.file_url && data) {
          await supabase.from("chat_attachments").insert({
            message_id: data.id,
            file_url: body.attachment.file_url,
            file_name: body.attachment.file_name || "file",
            file_type: body.attachment.file_type || "application/octet-stream",
            file_size: body.attachment.file_size || 0,
          });
        }
        return json(data, 201);
      }

      return err("Method not allowed", 405);
    }

    // ── PUSH SUBSCRIPTIONS (Web Push + Capacitor natif iOS/Android) ──
    if (resource === "push") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "POST") {
        const body = await req.json();
        const platform = (body.platform || "web") as "web" | "ios" | "android";

        if (platform === "web") {
          if (!body.endpoint || !body.keys) return err("endpoint and keys required");
          const { data, error: e } = await supabase.from("push_subscriptions")
            .upsert({
              user_id: user!.id,
              platform: "web",
              endpoint: body.endpoint,
              p256dh: body.keys.p256dh,
              auth: body.keys.auth,
            }, { onConflict: "endpoint" })
            .select().single();
          if (e) return err(e.message, 500);
          return json(data, 201);
        }

        // Native (Capacitor)
        if (!body.native_token) return err("native_token required for ios/android");
        const { data, error: e } = await supabase.from("push_subscriptions")
          .upsert({
            user_id: user!.id,
            platform,
            native_token: body.native_token,
          }, { onConflict: "user_id,native_token" })
          .select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "DELETE") {
        const body = await req.json().catch(() => ({}));
        const q = supabase.from("push_subscriptions").delete().eq("user_id", user!.id);
        if (body.endpoint) {
          const { error: e } = await q.eq("endpoint", body.endpoint);
          if (e) return err(e.message, 500);
        } else if (body.native_token) {
          const { error: e } = await q.eq("native_token", body.native_token);
          if (e) return err(e.message, 500);
        } else {
          return err("endpoint or native_token required");
        }
        return json({ success: true });
      }
      return err("Method not allowed", 405);
    }

    // ── VENDOR LOCATION (Pro) ──
    if (resource === "vendor-location") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "GET") {
        const { data, error: e } = await supabase.from("vendor_locations").select("*").eq("user_id", user!.id).maybeSingle();
        if (e) return err(e.message, 500);
        return json(data);
      }
      if (method === "PUT" || method === "POST") {
        const body = await req.json();
        const { data, error: e } = await supabase.from("vendor_locations")
          .upsert({ ...body, user_id: user!.id }, { onConflict: "user_id" })
          .select().single();
        if (e) return err(e.message, 500);
        return json(data);
      }
      if (method === "DELETE") {
        const { error: e } = await supabase.from("vendor_locations").delete().eq("user_id", user!.id);
        if (e) return err(e.message, 500);
        return json({ success: true });
      }
      return err("Method not allowed", 405);
    }

    // ── PRO SUBSCRIPTION REQUEST ──
    if (resource === "pro-request") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "POST") {
        const body = await req.json();
        if (!body.plan || !body.payment_method) return err("plan and payment_method required");
        const { data, error: e } = await supabase.from("pro_subscription_requests").insert({
          user_id: user!.id, plan: body.plan, payment_method: body.payment_method,
          payment_reference: body.payment_reference || null, amount: body.amount || 0,
          final_amount: body.final_amount || body.amount || 0, currency: body.currency || "KMF",
          promo_code: body.promo_code || null, discount_amount: body.discount_amount || 0,
          status: "pending",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "GET") {
        const { data, error: e } = await supabase.from("pro_subscription_requests")
          .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
        if (e) return err(e.message, 500);
        return json({ data });
      }
      return err("Method not allowed", 405);
    }

    // ── SOUMISSIONS DE CONTENU ──
    if (resource === "submit") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method !== "POST") return err("Method not allowed", 405);
      const body = await req.json();
      if (!id) return err("submission type required");

      if (id === "price") {
        const { data, error: e } = await supabase.from("prices").insert({
          ...body, submitted_by: user!.id, status: body.status || "draft",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (id === "content") {
        if (!body.type) return err("content.type required (announcement|article|service|tender)");
        const { data, error: e } = await supabase.from("content_items").insert({
          ...body, submitted_by: user!.id, status: body.status || "draft",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (id === "event") {
        const { data, error: e } = await supabase.from("events").insert({
          ...body, organizer_id: user!.id, status: body.status || "draft",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (id === "modification") {
        const { data, error: e } = await supabase.from("pending_modifications").insert({
          type: body.type || "edit", title: body.title || "Modification",
          content: body.content || {}, submitted_by: user!.id, status: "pending",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (id === "report") {
        const { data, error: e } = await supabase.from("content_reports").insert({
          reporter_id: user!.id, content_type: body.content_type, content_id: body.content_id,
          reason: body.reason, details: body.details || null, status: "pending",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      return err("Unknown submission type", 404);
    }

    // ── EVENT REGISTRATION ──
    if (resource === "event-registration") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "POST") {
        const body = await req.json();
        if (!body.event_id) return err("event_id required");
        const { data, error: e } = await supabase.from("event_registrations").insert({
          event_id: body.event_id, user_id: user!.id,
          payment_amount: body.payment_amount || 0,
          payment_status: body.payment_status || "pending",
          additional_info: body.additional_info || {},
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "GET") {
        const { data, error: e } = await supabase.from("event_registrations").select("*, events(*)").eq("user_id", user!.id);
        if (e) return err(e.message, 500);
        return json({ data });
      }
      return err("Method not allowed", 405);
    }

    // ── FREELANCE ACTIONS ──
    if (resource === "freelance-action") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "POST" && id === "proposal") {
        const body = await req.json();
        const { data, error: e } = await supabase.from("freelance_proposals").insert({
          job_id: body.job_id, freelancer_id: user!.id, cover_letter: body.cover_letter,
          proposed_amount: body.proposed_amount, currency: body.currency || "KMF",
          estimated_days: body.estimated_days, status: "pending",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "POST" && id === "job") {
        const body = await req.json();
        const { data, error: e } = await supabase.from("freelance_jobs").insert({
          ...body, posted_by: user!.id, status: body.status || "open",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "GET" && id === "my-proposals") {
        const { data, error: e } = await supabase.from("freelance_proposals").select("*, freelance_jobs(*)").eq("freelancer_id", user!.id);
        if (e) return err(e.message, 500);
        return json({ data });
      }
      // GET /freelance-action/job-conversations/{jobId}
      // Liste les freelancers ayant postulé à ma mission, avec stats de conversation
      if (method === "GET" && id === "job-conversations" && sub) {
        const { data: job } = await supabase.from("freelance_jobs").select("posted_by").eq("id", sub).single();
        if (!job || job.posted_by !== user!.id) return err("Forbidden", 403);
        const { data: proposals } = await supabase
          .from("freelance_proposals")
          .select("id, freelancer_id, status, proposed_amount, currency, created_at")
          .eq("job_id", sub);
        const freelancerIds = (proposals || []).map((p: any) => p.freelancer_id);
        const { data: usernames } = await supabase.rpc("get_public_usernames", { _user_ids: freelancerIds });
        const uMap = new Map<string, any>((usernames || []).map((u: any) => [u.id, u]));
        // Dernier message + non lus pour chaque freelancer
        const enriched = await Promise.all((proposals || []).map(async (p: any) => {
          const { data: lastMsg } = await supabase
            .from("direct_messages")
            .select("content, created_at, sender_id")
            .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${p.freelancer_id}),and(sender_id.eq.${p.freelancer_id},receiver_id.eq.${user!.id})`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const { count: unread } = await supabase
            .from("direct_messages")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", p.freelancer_id)
            .eq("receiver_id", user!.id)
            .eq("is_read", false);
          const u = uMap.get(p.freelancer_id);
          return {
            proposal: p,
            partner_id: p.freelancer_id,
            partner_username: u?.username || "Anonyme",
            partner_avatar_url: u?.avatar_url || null,
            last_message: lastMsg?.content || null,
            last_message_at: lastMsg?.created_at || null,
            unread_count: unread || 0,
          };
        }));
        return json({ job_id: sub, data: enriched });
      }
      return err("Unknown action", 404);
    }

    // ── DIASPORA ACTIONS ──
    if (resource === "diaspora-action") {
      const { user, response } = await requireUser();
      if (response) return response;
      if (method === "POST" && id === "investment") {
        const body = await req.json();
        const { data, error: e } = await supabase.from("diaspora_investments").insert({
          ...body, investor_id: user!.id, status: "pending",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "POST" && id === "project") {
        const body = await req.json();
        const { data, error: e } = await supabase.from("investments").insert({
          ...body, carrier_id: user!.id, status: body.status || "draft",
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "GET" && id === "my-investments") {
        const { data, error: e } = await supabase.from("diaspora_investments").select("*, diaspora_projects(*)").eq("investor_id", user!.id);
        if (e) return err(e.message, 500);
        return json({ data });
      }
      return err("Unknown action", 404);
    }

    // ── ENTERPRISE CRM ──
    if (resource === "enterprise-action") {
      const { user, response } = await requireUser();
      if (response) return response;
      const { data: ent } = await supabase.rpc("get_enterprise_id", { _user_id: user!.id });
      if (!ent) return err("No active enterprise profile", 403);
      if (method === "GET" && id === "clients") {
        const { data, error: e } = await supabase.from("crm_clients").select("*").eq("enterprise_id", ent);
        if (e) return err(e.message, 500);
        return json({ data });
      }
      if (method === "POST" && id === "client") {
        const body = await req.json();
        const { data, error: e } = await supabase.from("crm_clients").insert({ ...body, enterprise_id: ent }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      if (method === "GET" && id === "invoices") {
        const { data, error: e } = await supabase.from("crm_invoices").select("*").eq("enterprise_id", ent);
        if (e) return err(e.message, 500);
        return json({ data });
      }
      if (method === "POST" && id === "invoice") {
        const body = await req.json();
        const { data, error: e } = await supabase.from("crm_invoices").insert({ ...body, enterprise_id: ent }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      return err("Unknown enterprise action", 404);
    }

    // ── COMMENTS ──
    if (resource === "comments") {
      if (method === "GET") {
        const contentType = url.searchParams.get("content_type");
        const contentId = url.searchParams.get("content_id");
        if (!contentType || !contentId) return err("content_type and content_id required");
        const { data, error: e } = await supabase.from("comments")
          .select("*, users(username, avatar_url)").eq("content_type", contentType).eq("content_id", contentId)
          .order("created_at", { ascending: false });
        if (e) return err(e.message, 500);
        return json({ data });
      }
      if (method === "POST") {
        const { user, response } = await requireUser();
        if (response) return response;
        const body = await req.json();
        if (!body.content_type || !body.content_id || !body.content) return err("content_type, content_id, content required");
        const { data, error: e } = await supabase.from("comments").insert({
          user_id: user!.id, content_type: body.content_type, content_id: body.content_id, content: body.content,
        }).select().single();
        if (e) return err(e.message, 500);
        return json(data, 201);
      }
      return err("Method not allowed", 405);
    }

    // ── SEARCH GLOBAL ──
    if (resource === "search" && method === "GET") {
      if (!hasPermission(keyInfo, "login") && !hasPermission(keyInfo, "admin")) return err("Permission denied", 403);
      const q = url.searchParams.get("q") || "";
      if (q.length < 2) return err("query too short (min 2 chars)");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const [prices, events, content, gastronomy, freelancers] = await Promise.allSettled([
        supabase.from("prices").select("id, product_name, category, island, price").eq("status", "published").ilike("product_name", `%${q}%`).limit(limit),
        supabase.from("events").select("id, title, date, island").eq("status", "published").ilike("title", `%${q}%`).limit(limit),
        supabase.from("content_items").select("id, title, type, island").eq("status", "published").ilike("title", `%${q}%`).limit(limit),
        supabase.from("gastronomy_items").select("id, name, type, island").ilike("name", `%${q}%`).limit(limit),
        supabase.from("freelancer_profiles").select("id, display_name, skills, island").eq("is_visible", true).ilike("display_name", `%${q}%`).limit(limit),
      ]);
      const ok = (r: PromiseSettledResult<{ data: unknown }>) => r.status === "fulfilled" ? (r.value.data || []) : [];
      return json({ q, results: { prices: ok(prices), events: ok(events), content: ok(content), gastronomy: ok(gastronomy), freelancers: ok(freelancers) } });
    }

    // ── INCREMENT VIEW ──
    if (resource === "view" && method === "POST") {
      if (!hasPermission(keyInfo, "login") && !hasPermission(keyInfo, "admin")) return err("Permission denied", 403);
      const body = await req.json();
      if (!body.type || !body.id) return err("type and id required");
      const { error: e } = await supabase.rpc("increment_content_view", { _type: body.type, _id: body.id });
      if (e) return err(e.message, 500);
      return json({ success: true });
    }

    // ── INFOS PRATIQUES (taxi, pharmacie) ──
    if (resource === "infos-pratiques" && method === "GET") {
      if (!hasPermission(keyInfo, "login") && !hasPermission(keyInfo, "admin")) return err("Permission denied", 403);
      const type = url.searchParams.get("type"); // 'taxi' | 'pharmacy' | null
      const island = url.searchParams.get("island");

      const tasks: Promise<unknown>[] = [];
      const wantTaxi = !type || type === "taxi";
      const wantPharma = !type || type === "pharmacy";

      if (wantTaxi) {
        let qt = supabase.from("taxi_fares").select("*").eq("is_active", true);
        if (island) qt = qt.eq("island", island);
        tasks.push(qt);
      }
      if (wantPharma) {
        let qp = supabase.from("pharmacy_guards").select("*").eq("is_active", true);
        if (island) qp = qp.eq("island", island);
        tasks.push(qp);
      }

      const results = await Promise.all(tasks);
      const out: Record<string, unknown> = {};
      let i = 0;
      if (wantTaxi)   out.taxi      = (results[i++] as { data: unknown[] }).data || [];
      if (wantPharma) out.pharmacy  = (results[i++] as { data: unknown[] }).data || [];
      return json({ data: out });
    }

    // ── PARTENAIRES ──
    if (resource === "partners" && method === "GET") {
      if (!hasPermission(keyInfo, "login") && !hasPermission(keyInfo, "admin")) return err("Permission denied", 403);
      const { data, error: e } = await supabase.from("partner_accounts")
        .select("id, business_name, island, location, status").eq("status", "active");
      if (e) return err(e.message, 500);
      return json({ data });
    }

    // ── PUBLIC STATS ──
    if (resource === "public-stats" && method === "GET") {
      if (!hasPermission(keyInfo, "login") && !hasPermission(keyInfo, "admin")) return err("Permission denied", 403);
      const [p, e2, c, f] = await Promise.all([
        supabase.from("prices").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("content_items").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("freelancer_profiles").select("id", { count: "exact", head: true }).eq("is_visible", true),
      ]);
      return json({ prices: p.count || 0, events: e2.count || 0, content: c.count || 0, freelancers: f.count || 0 });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ROUTES ADMIN UNIQUEMENT
    // ═══════════════════════════════════════════════════════════════════════
    if (!hasPermission(keyInfo, "admin")) {
      return err("Admin permission required", 403);
    }

    // ── USERS ──
    if (resource === "users") {
      if (method === "GET" && !id) {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const search = url.searchParams.get("search");

        let query = supabase.from("users").select("id, username, email, avatar_url, bio, account_type, created_at", { count: "exact" });
        if (search) query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
        const { data, count, error: qErr } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count, limit, offset });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("users").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: id });
        return json({ ...data, role: roleData || "user" });
      }
      return err("Method not allowed", 405);
    }

    // ── PRICES ──
    if (resource === "prices") {
      if (method === "GET" && !id) {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const island = url.searchParams.get("island");
        const category = url.searchParams.get("category");
        const status = url.searchParams.get("status") || "published";

        let query = supabase.from("prices").select("*", { count: "exact" });
        if (island) query = query.eq("island", island);
        if (category) query = query.eq("category", category);
        if (status !== "all") query = query.eq("status", status);
        const { data, count, error: qErr } = await query.range(offset, offset + limit - 1).order("updated_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count, limit, offset });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("prices").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        return json(data);
      }
      if (method === "PUT" && id) {
        const body = await req.json();
        const { data, error: qErr } = await supabase.from("prices").update(body).eq("id", id).select().single();
        if (qErr) return err(qErr.message, 500);
        return json(data);
      }
      if (method === "DELETE" && id) {
        const { error: qErr } = await supabase.from("prices").delete().eq("id", id);
        if (qErr) return err(qErr.message, 500);
        return json({ success: true });
      }
      return err("Method not allowed", 405);
    }

    // ── EVENTS ──
    if (resource === "events") {
      if (method === "GET" && !id) {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const status = url.searchParams.get("status") || "published";

        let query = supabase.from("events").select("*", { count: "exact" });
        if (status !== "all") query = query.eq("status", status);
        const { data, count, error: qErr } = await query.range(offset, offset + limit - 1).order("date", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count, limit, offset });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("events").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        return json(data);
      }
      if (method === "PUT" && id) {
        const body = await req.json();
        const { data, error: qErr } = await supabase.from("events").update(body).eq("id", id).select().single();
        if (qErr) return err(qErr.message, 500);
        return json(data);
      }
      if (method === "DELETE" && id) {
        const { error: qErr } = await supabase.from("events").delete().eq("id", id);
        if (qErr) return err(qErr.message, 500);
        return json({ success: true });
      }
      return err("Method not allowed", 405);
    }

    // ── CONTENT ITEMS ──
    if (resource === "content") {
      if (method === "GET" && !id) {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const type = url.searchParams.get("type");
        const status = url.searchParams.get("status") || "published";

        let query = supabase.from("content_items").select("*", { count: "exact" });
        if (type) query = query.eq("type", type);
        if (status !== "all") query = query.eq("status", status);
        const { data, count, error: qErr } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count, limit, offset });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("content_items").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        return json(data);
      }
      if (method === "PUT" && id) {
        const body = await req.json();
        const { data, error: qErr } = await supabase.from("content_items").update(body).eq("id", id).select().single();
        if (qErr) return err(qErr.message, 500);
        return json(data);
      }
      return err("Method not allowed", 405);
    }

    // ── GASTRONOMY / TOURISM ──
    if (resource === "gastronomy") {
      if (method === "GET" && !id) {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const type = url.searchParams.get("type");

        let query = supabase.from("gastronomy_items").select("*", { count: "exact" });
        if (type) query = query.eq("type", type);
        const { data, count, error: qErr } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count, limit, offset });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("gastronomy_items").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        return json(data);
      }
      return err("Method not allowed", 405);
    }

    // ── ENTERPRISES ──
    if (resource === "enterprises") {
      if (method === "GET" && !id) {
        const { data, count, error: qErr } = await supabase
          .from("enterprise_profiles")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("enterprise_profiles").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        return json(data);
      }
      return err("Method not allowed", 405);
    }

    // ── FREELANCERS ──
    if (resource === "freelancers") {
      if (method === "GET" && !id) {
        const { data, count, error: qErr } = await supabase
          .from("freelancer_profiles")
          .select("*", { count: "exact" })
          .eq("is_visible", true)
          .order("created_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("freelancer_profiles").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        return json(data);
      }
      return err("Method not allowed", 405);
    }

    // ── DIASPORA PROJECTS ──
    if (resource === "diaspora") {
      if (method === "GET" && !id) {
        const status = url.searchParams.get("status") || "published";
        let query = supabase.from("investments").select("*", { count: "exact" });
        if (status !== "all") query = query.eq("status", status);
        const { data, count, error: qErr } = await query.order("created_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("investments").select("*").eq("id", id).single();
        if (qErr) return err(qErr.message, 404);
        return json(data);
      }
      return err("Method not allowed", 405);
    }

    // ── NOTIFICATIONS ──
    if (resource === "notifications") {
      if (method === "POST") {
        const body = await req.json();
        if (!body.title || !body.message) return err("title and message required");
        const { data, error: qErr } = await supabase.from("notifications").insert({
          title: body.title,
          message: body.message,
          type: body.type || "info",
          link: body.link,
          user_id: body.user_id || null,
        }).select().single();
        if (qErr) return err(qErr.message, 500);
        return json(data, 201);
      }
      return err("Method not allowed", 405);
    }

    // ── STATS (dashboard) ──
    if (resource === "stats") {
      const [users, prices, events, content, enterprises, freelancers] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("prices").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("content_items").select("id", { count: "exact", head: true }),
        supabase.from("enterprise_profiles").select("id", { count: "exact", head: true }),
        supabase.from("freelancer_profiles").select("id", { count: "exact", head: true }),
      ]);
      return json({
        users: users.count || 0,
        prices: prices.count || 0,
        events: events.count || 0,
        content_items: content.count || 0,
        enterprises: enterprises.count || 0,
        freelancers: freelancers.count || 0,
      });
    }

    return err("Resource not found: " + resource, 404);
  } catch (e) {
    console.error("API Error:", e);
    return err("Internal server error", 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI 3.1 spec for the mobile API. Kept here so it stays in sync with the
// route handlers above.
// ─────────────────────────────────────────────────────────────────────────────
function buildOpenApiSpec() {
  const base = `${SUPABASE_URL}/functions/v1/mobile-api`;
  return {
    openapi: "3.1.0",
    info: {
      title: "Ujamaan Mobile API",
      version: "1.0.0",
      description:
        "API privée alimentant l'application mobile Ujamaan. Toutes les routes (sauf /openapi.json et /warmup) requièrent l'en-tête `x-api-key`. Les routes utilisateur exigent en plus un Bearer token. Les fonctionnalités d'administration interne ne sont pas exposées.",
    },
    servers: [{ url: base }],
    components: {
      securitySchemes: {
        ApiKey: { type: "apiKey", in: "header", name: "x-api-key" },
        Bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ ApiKey: [] }],
    paths: {
      "/auth/login": {
        post: {
          summary: "Connexion utilisateur",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] } } } },
          responses: { "200": { description: "Session créée" }, "401": { description: "Identifiants invalides" } },
        },
      },
      "/auth/refresh": {
        post: { summary: "Rafraîchir le token", responses: { "200": { description: "OK" } } },
      },
      "/auth/me": {
        get: { summary: "Profil de l'utilisateur connecté", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "Profil" } } },
      },
      "/auth/register": {
        post: {
          summary: "Inscription (email + mot de passe)",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" }, username: { type: "string" } }, required: ["email", "password"] } } } },
          responses: { "201": { description: "Compte créé (peut nécessiter confirmation email)" } },
        },
      },
      "/auth/logout": { post: { summary: "Déconnexion (révoque le token)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/auth/reset-password": {
        post: {
          summary: "Demande de reset par email",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, redirectTo: { type: "string" } }, required: ["email"] } } } },
          responses: { "200": { description: "Email envoyé" } },
        },
      },
      "/ai-chat": {
        post: {
          summary: "Conversation avec l'assistant IA",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, sessionId: { type: "string" } }, required: ["message", "sessionId"] } } } },
          responses: { "200": { description: "Réponse de l'assistant" } },
        },
      },
      "/public/{resource}": {
        get: {
          summary: "Lister du contenu public",
          parameters: [
            { name: "resource", in: "path", required: true, schema: { type: "string", enum: ["prices", "events", "content", "gastronomy", "freelancers", "diaspora", "fundraising", "vendor-locations", "enterprises", "partners"] } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: { "200": { description: "Liste paginée" } },
        },
      },
      "/profile": {
        get: { summary: "Profil de l'utilisateur connecté", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "Profil" } } },
        put: { summary: "Mettre à jour son profil", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        delete: { summary: "Demander la suppression du compte", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "Demande enregistrée" } } },
      },
      "/favorites": {
        get: { summary: "Mes favoris", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        post: { summary: "Ajouter un favori", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
      },
      "/favorites/{id}": { delete: { summary: "Retirer un favori", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/my-notifications": { get: { summary: "Mes notifications", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/my-notifications/{id}": { put: { summary: "Marquer une notification lue", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/my-notifications/read-all": { put: { summary: "Tout marquer lu", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/messages": {
        get: { summary: "Mes conversations privées (groupées par interlocuteur)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        post: { summary: "Envoyer un message ({ receiver_id, content, attachment? })", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
      },
      "/messages/unread-count": { get: { summary: "Nombre total de messages non lus", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/messages/{partnerId}": { get: { summary: "Fil complet avec un interlocuteur (auto-marque comme lu)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/messages/{partnerId}/since": { get: { summary: "Sync incrémentale ?ts=ISO", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/messages/{partnerId}/read": { post: { summary: "Marquer la conversation comme lue", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/messages/with-freelancer/{freelancerUserId}": { get: { summary: "Ouvrir/charger le fil avec un freelancer (mission)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/freelance-action/job-conversations/{jobId}": { get: { summary: "Conversations liées à ma mission (annonceur)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } } },
      "/push": {
        post: { summary: "Enregistrer un endpoint push", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
        delete: { summary: "Désinscrire un endpoint push", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
      },
      "/vendor-location": {
        get: { summary: "Ma position vendeur (Pro)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        put: { summary: "Mettre à jour ma position", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        delete: { summary: "Supprimer ma position", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
      },
      "/pro-request": {
        get: { summary: "Mes demandes Pro", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        post: { summary: "Soumettre une demande Pro (Stripe/Mvola/Cash)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
      },
      "/submit/{type}": {
        post: {
          summary: "Soumettre un contenu (price, content, event, modification, report)",
          security: [{ ApiKey: [] }, { Bearer: [] }],
          parameters: [{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["price", "content", "event", "modification", "report"] } }],
          responses: { "201": { description: "Créé" } },
        },
      },
      "/event-registration": {
        get: { summary: "Mes inscriptions", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        post: { summary: "S'inscrire à un événement", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
      },
      "/freelance-action/{action}": {
        post: { summary: "Actions freelance (proposal | job)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
        get: { summary: "Mes propositions (action=my-proposals)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
      },
      "/diaspora-action/{action}": {
        post: { summary: "Actions diaspora (investment | project)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
        get: { summary: "Mes investissements (action=my-investments)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
      },
      "/enterprise-action/{action}": {
        get: { summary: "CRM entreprise (clients | invoices)", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "200": { description: "OK" } } },
        post: { summary: "Créer client | invoice", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
      },
      "/comments": {
        get: { summary: "Commentaires (params content_type, content_id)", responses: { "200": { description: "OK" } } },
        post: { summary: "Publier un commentaire", security: [{ ApiKey: [] }, { Bearer: [] }], responses: { "201": { description: "Créé" } } },
      },
      "/search": { get: { summary: "Recherche globale (param q)", responses: { "200": { description: "Résultats agrégés" } } } },
      "/view": { post: { summary: "Incrémenter le compteur de vues", responses: { "200": { description: "OK" } } } },
      "/infos-pratiques": { get: { summary: "Infos pratiques (taxi, pharmacie)", responses: { "200": { description: "OK" } } } },
      "/partners": { get: { summary: "Partenaires actifs", responses: { "200": { description: "OK" } } } },
      "/public-stats": { get: { summary: "Compteurs publics homepage", responses: { "200": { description: "OK" } } } },
      "/users": { get: { summary: "Lister les utilisateurs (admin)", responses: { "200": { description: "Liste" } } } },
      "/users/{id}": { get: { summary: "Détail utilisateur (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Profil" } } } },
      "/prices": { get: { summary: "Lister les prix (admin)", responses: { "200": { description: "Liste" } } } },
      "/prices/{id}": {
        get: { summary: "Détail (admin)", responses: { "200": { description: "OK" } } },
        put: { summary: "Mise à jour (admin)", responses: { "200": { description: "OK" } } },
        delete: { summary: "Suppression (admin)", responses: { "200": { description: "OK" } } },
      },
      "/events": { get: { summary: "Liste (admin)", responses: { "200": { description: "OK" } } } },
      "/events/{id}": {
        get: { summary: "Détail (admin)", responses: { "200": { description: "OK" } } },
        put: { summary: "Mise à jour (admin)", responses: { "200": { description: "OK" } } },
        delete: { summary: "Suppression (admin)", responses: { "200": { description: "OK" } } },
      },
      "/content": { get: { summary: "Articles, services, annonces, AO (admin)", responses: { "200": { description: "OK" } } } },
      "/content/{id}": {
        get: { summary: "Détail (admin)", responses: { "200": { description: "OK" } } },
        put: { summary: "Mise à jour (admin)", responses: { "200": { description: "OK" } } },
        delete: { summary: "Suppression (admin)", responses: { "200": { description: "OK" } } },
      },
      "/warmup": { get: { summary: "Réchauffe le cache IA (utilisé par cron)", security: [], responses: { "200": { description: "OK" } } } },
      "/openapi.json": { get: { summary: "Cette spec OpenAPI", security: [], responses: { "200": { description: "Spec OpenAPI 3.1" } } } },
    },
  };
}
