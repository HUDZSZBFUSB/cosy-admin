import { NextResponse } from "next/server";
import { dbInsertOrder } from "@/lib/db";

const TOKEN      = process.env.TIKTOK_ACCESS_TOKEN;
const ADVERTISER = process.env.TIKTOK_ADVERTISER_ID;

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function getTikTokPurchases() {
  const url = new URL("https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/");
  url.searchParams.set("advertiser_id", ADVERTISER);
  url.searchParams.set("report_type",   "BASIC");
  url.searchParams.set("data_level",    "AUCTION_CONVERSION");
  url.searchParams.set("dimensions",    JSON.stringify(["stat_time_day"]));
  url.searchParams.set("metrics",       JSON.stringify(["real_time_conversion"]));
  url.searchParams.set("start_date",    today());
  url.searchParams.set("end_date",      today());
  url.searchParams.set("page",          "1");
  url.searchParams.set("page_size",     "1");

  const res  = await fetch(url.toString(), { headers: { "Access-Token": TOKEN }, cache: "no-store" });
  const json = await res.json();
  if (json.code !== 0) return { ok: false, error: json.message, code: json.code };
  const list  = json.data?.list || [];
  const total = list.reduce((s, row) => s + parseInt(row.metrics?.real_time_conversion || 0), 0);
  return { ok: true, count: total };
}

export async function GET() {
  try {
    const result = await getTikTokPurchases();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, code: result.code });
    }
    return NextResponse.json({ ok: true, conversionCount: result.count });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
