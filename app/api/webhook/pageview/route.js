import { NextResponse } from "next/server";
import { dbInsertPageview } from "@/lib/db";

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
    await dbInsertPageview({
      path:     data.path || data.page || "/",
      referrer: data.referrer || data.ref || "",
      ua:       data.ua || "",
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS });
  }
}
