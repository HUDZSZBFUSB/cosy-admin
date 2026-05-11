import { NextResponse } from "next/server";
import { dbUpsertCheckout } from "@/lib/db";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  try {
    const data = await req.json();
    await dbUpsertCheckout({
      session_id: data.session_id || `sess_${Date.now()}`,
      email:      data.email || "",
      name:       data.name  || "",
      cart:       JSON.stringify(data.cart || data.items || []),
      cart_total: parseFloat(data.cart_total || data.total) || 0,
      step:       data.step || "initiated",
      completed:  data.completed ? true : false,
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS });
  }
}
