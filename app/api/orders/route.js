import { NextResponse } from "next/server";
import { dbGetOrders } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const result = await dbGetOrders({
    q:        searchParams.get("q") || "",
    page:     parseInt(searchParams.get("page") || "1"),
    pageSize: 20,
  });
  return NextResponse.json(result);
}
