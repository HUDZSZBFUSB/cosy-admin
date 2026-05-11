import { NextResponse } from "next/server";
import { dbPingSession } from "@/lib/db";

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
    const { session_id, page, lat, lng, city, country } = await req.json();
    if (session_id) {
      await dbPingSession({ session_id, page, lat, lng, city, country });
    }
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS });
  }
}
