import { NextResponse } from "next/server";
import { dbInsertOrder } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { event } = body;

    if (!event) {
      return NextResponse.json({ ok: false, error: "No event" }, { status: 400 });
    }

    if (event === "Purchase" || event === "CompletePayment") {
      const id = Date.now();
      await dbInsertOrder({
        order_id:   `TK-${id}`,
        created_at: new Date().toISOString(),
        status:     "paid",
        source:     "tiktok",
        name:       "Client TikTok",
        email:      body.user?.email || "",
        total:      body.properties?.value || 0,
      });
    }

    return NextResponse.json({ ok: true, event });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

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
