import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Receive TikTok pixel events from the local tracker
export async function POST(req) {
  try {
    const body = await req.json();
    const { event, pixel_code, timestamp, context } = body;

    if (!event) {
      return NextResponse.json({ ok: false, error: "No event" }, { status: 400 });
    }

    const db = await getDb();

    // Log all events for debugging
    if (!db.data.tiktok_events) db.data.tiktok_events = [];
    db.data.tiktok_events.unshift({
      event,
      pixel_code,
      timestamp: timestamp || new Date().toISOString(),
      ip: context?.ip,
      receivedAt: new Date().toISOString(),
    });
    // Keep last 200 events only
    db.data.tiktok_events = db.data.tiktok_events.slice(0, 200);

    // If it's a Purchase event → create an order and notify
    if (event === "Purchase" || event === "CompletePayment") {
      if (!db.data.orders) db.data.orders = [];
      const id = Date.now();
      db.data.orders.unshift({
        id,
        order_id:   `TK-${id}`,
        created_at: new Date().toISOString(),
        status:     "paid",
        source:     "tiktok",
        name:       "Client TikTok",
        email:      body.user?.email || "",
        total:      body.properties?.value || 0,
      });

      // Update tiktok_state so the poll route stays consistent
      if (!db.data.tiktok_state) db.data.tiktok_state = {};
      db.data.tiktok_state.last_event_purchase = new Date().toISOString();
      db.data.tiktok_state.new_purchase = true;
    }

    await db.write();

    return NextResponse.json({ ok: true, event });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// Allow preflight CORS (the shop is on port 3000, admin on 4000)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
