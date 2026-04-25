// Notify admin of a new order.
// Currently logs the order details server-side; can be extended to send email
// once a sender domain is configured in Lovable Cloud.
import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("order_number, customer_name, whatsapp_phone, neighborhood, notes, total_xof, created_at")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_xof")
      .eq("order_id", orderId);

    // Server-side log — visible in Edge Function logs.
     
    console.log("NEW ORDER", {
      order_number: order.order_number,
      customer: order.customer_name,
      phone: order.whatsapp_phone,
      neighborhood: order.neighborhood,
      notes: order.notes,
      total_xof: order.total_xof,
      items,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
