import { NextResponse } from "next/server";
import { dbInsertOrder, dbUpsertCheckout, dbGetCheckouts, dbMarkReminderConvertedByEmail } from "@/lib/db";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function fireTikTokPurchase({ order_id, email, total, items, ip, user_agent }) {
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const token   = process.env.TIKTOK_ACCESS_TOKEN;
  if (!pixelId || !token) return;

  const contents = (() => {
    try {
      const parsed = typeof items === "string" ? JSON.parse(items) : (items || []);
      return parsed.map((it) => ({
        content_id:   it.productId || it.handle || "product",
        content_name: it.title || it.name || "",
        content_type: "product",
        quantity:     it.quantity || it.qty || 1,
        price:        parseFloat(it.price) || 0,
      }));
    } catch { return []; }
  })();

  const body = {
    pixel_code: pixelId,
    event:      "Purchase",
    timestamp:  new Date().toISOString(),
    context: {
      ...(ip         ? { ip }         : {}),
      ...(user_agent ? { user_agent } : {}),
      ...(email      ? { user: { email } } : {}),
    },
    properties: {
      order_id,
      value:        parseFloat(total) || 0,
      currency:     "EUR",
      content_type: "product",
      contents,
    },
  };

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
      method:  "POST",
      headers: { "Access-Token": token, "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const json = await res.json();
    if (json.code !== 0) console.warn("[tiktok-event] erreur:", json.message);
    else console.log("[tiktok-event] Purchase envoyé ✓", order_id, total + "€");
  } catch (e) {
    console.warn("[tiktok-event] fetch failed:", e.message);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  try {
    const data = await req.json();
    const order_id = data.order_id || data.id || `ord_${Date.now()}`;
    const email    = data.email    || "";
    const name     = data.name     || data.billing_name || "";
    const total    = parseFloat(data.total || data.amount) || 0;
    const items    = data.items    || data.line_items || [];
    const ip       = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const ua       = req.headers.get("user-agent") || "";

    // 1. Enregistrer la commande
    await dbInsertOrder({ order_id, email, name, total, currency: "EUR", items: JSON.stringify(items), status: "paid" });

    // 2. Marquer le checkout comme converti
    const session_id = data.session_id || "";
    const { rows: checkouts } = await dbGetCheckouts({ filter: "all", pageSize: 9999 });
    const checkout = checkouts.find(c =>
      (email && c.email === email) || (session_id && c.session_id === session_id)
    );
    if (checkout) {
      await dbUpsertCheckout({ ...checkout, completed: true, completed_at: new Date().toISOString() });
    }

    // 3. Marquer les relances comme converties
    if (email) await dbMarkReminderConvertedByEmail(email);

    // 4. Fire TikTok Events API
    await fireTikTokPurchase({ order_id, email, total, items, ip, user_agent: ua });

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS });
  }
}
