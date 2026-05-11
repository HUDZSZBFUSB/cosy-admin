import { NextResponse } from "next/server";
import { dbGetCheckouts } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const result = await dbGetCheckouts({
    filter:   searchParams.get("filter") || "all",
    q:        searchParams.get("q") || "",
    page:     parseInt(searchParams.get("page") || "1"),
    pageSize: parseInt(searchParams.get("pageSize") || "20"),
  });
  return NextResponse.json(result);
}
