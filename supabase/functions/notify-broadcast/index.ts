import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, url } = await req.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(JSON.stringify({ error: "VAPID not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all push subscriptions
    const { data: subscriptions, error: subError } = await adminClient
      .from("push_subscriptions")
      .select("*");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, total: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/",
      icon: "/pwa-192x192.png",
      badge: "/favicon.png",
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        // Simple push without encryption (plain text payload via fetch)
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            TTL: "86400",
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          sent++;
        } else {
          failed++;
          // Remove expired subscriptions
          if (response.status === 404 || response.status === 410) {
            await adminClient
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
        }
      } catch (err) {
        console.error("Push error for sub:", sub.id, err);
        failed++;
      }
    }

    // Also insert a broadcast notification in the notifications table
    await adminClient.from("notifications").insert({
      title,
      message: body,
      type: "push",
      link: url || "/",
      user_id: null,
    });

    console.log(`Push broadcast: ${sent} sent, ${failed} failed, ${subscriptions.length} total`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-broadcast error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
