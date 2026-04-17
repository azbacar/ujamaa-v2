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

  // Extract API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return err("Missing x-api-key header", 401);
  }

  const keyInfo = await validateApiKey(supabase, apiKey);
  if (!keyInfo) {
    return err("Invalid or expired API key", 401);
  }

  const url = new URL(req.url);
  const { resource, id, sub } = parseRoute(url);
  const method = req.method;

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
      const sub = id; // 'prices' | 'events' | 'content' | 'gastronomy' | 'freelancers' | 'diaspora'
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const tableMap: Record<string, string> = {
        prices: "prices", events: "events", content: "content_items",
        gastronomy: "gastronomy_items", freelancers: "freelancer_profiles", diaspora: "diaspora_projects",
      };
      const table = tableMap[sub || ""];
      if (!table) return err("Unknown public resource", 404);
      let q = supabase.from(table).select("*", { count: "exact" });
      if (table !== "freelancer_profiles") q = q.eq("status", "published");
      else q = q.eq("is_visible", true);
      const { data, count, error: qErr } = await q.range(offset, offset + limit - 1).order("created_at", { ascending: false });
      if (qErr) return err(qErr.message, 500);
      return json({ data, total: count, limit, offset });
    }

    // ── PUBLIC ENDPOINT: LOGIN ──
    if (resource === "auth" && method === "POST") {
      if (!hasPermission(keyInfo, "login")) return err("Permission denied", 403);

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

    // ── ADMIN-ONLY ENDPOINTS ──
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
        let query = supabase.from("diaspora_projects").select("*", { count: "exact" });
        if (status !== "all") query = query.eq("status", status);
        const { data, count, error: qErr } = await query.order("created_at", { ascending: false });
        if (qErr) return err(qErr.message, 500);
        return json({ data, total: count });
      }
      if (method === "GET" && id) {
        const { data, error: qErr } = await supabase.from("diaspora_projects").select("*").eq("id", id).single();
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
