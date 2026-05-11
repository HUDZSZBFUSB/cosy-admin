import { NextResponse } from "next/server";
import { dbGetLive } from "@/lib/db";

export async function GET() {
  const data = await dbGetLive();
  return NextResponse.json(data);
}
