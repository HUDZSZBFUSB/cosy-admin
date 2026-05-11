import { NextResponse } from "next/server";
import { dbGetStats } from "@/lib/db";

export async function GET() {
  const stats = await dbGetStats();
  return NextResponse.json(stats);
}
