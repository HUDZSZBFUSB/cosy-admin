import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const TOKEN      = process.env.TIKTOK_ACCESS_TOKEN;
const ADVERTISER = process.env.TIKTOK_ADVERTISER_ID;
const PIXEL_ID   = process.env.TIKTOK_PIXEL_ID;

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function getTikTokPurchases() {
  // Méthode 1 — Reporting API (nécessite scope "reporting")
  const url    = new URL("https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/");
  url.searchParams.set("advertiser_id", ADVERTISER);
  url.searchParams.set("report_type",   "BASIC");
  url.searchParams.set("data_level",    "AUCTION_CONVERSION");
  url.searchParams.set("dimensions",    JSON.stringify(["stat_time_day"]));
  url.searchParams.set("metrics",       JSON.stringify(["real_time_conversion", "conversion_rate", "real_time_cost_per_conversion"]));
  url.searchParams.set("start_date",    today());
  url.searchParams.set("end_date",      today());
  url.searchParams.set("page",          "1");
  url.searchParams.set("page_size",     "1");

  const res  = await fetch(url.toString(), {
    headers: { "Access-Token": TOKEN },
    cache: "no-store",
  });
  const json = await res.json();

  if (json.code !== 0) {
    return { ok: false, error: json.message, code: json.code };
  }

  const list  = json.data?.list || [];
  const total = list.reduce((s, row) => s + parseInt(row.metrics?.real_time_conversion || 0), 0);
  return { ok: true, count: total };
}

export async function GET() {
  try {
    const db = await getDb();
    if (!db.data.tiktok_state) {
      db.data.tiktok_state = { last_conversion_count: 0, last_checked: null };
    }

    const result = await getTikTokPurchases();

    if (!result.ok) {
      return NextResponse.json({
        ok:    false,
        error: result.error,
        code:  result.code,
        hint:  result.code === 40001
          ? "Token sans scope reporting — regénère le token avec le scope 'reporting' activé sur business.tiktok.com"
          : "Erreur TikTok API",
      });
    }

    const conversionCount = result.count;
    const prevCount       = db.data.tiktok_state.last_conversion_count || 0;
    const newOrders       = Math.max(0, conversionCount - prevCount);
    const hasNew          = newOrders > 0;

    if (hasNew) {
      for (let i = 0; i < newOrders; i++) {
        if (!db.data.orders) db.data.orders = [];
        db.data.orders.push({
          id:         Date.now() + i,
          order_id:   `TK-${Date.now() + i}`,
          created_at: new Date().toISOString(),
          status:     "paid",
          source:     "tiktok",
          name:       "Client TikTok",
          email:      "",
          total:      0,
        });
      }
      db.data.tiktok_state.last_conversion_count = conversionCount;
    }

    db.data.tiktok_state.last_checked = new Date().toISOString();
    await db.write();

    return NextResponse.json({ ok: true, conversionCount, prevCount, newOrders, hasNew });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
