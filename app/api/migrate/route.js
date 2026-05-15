import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Migration unique : copie les anciens tableaux JSON vers les nouveaux hashes Redis
export async function GET() {
  try {
    let migratedCheckouts = 0;
    let migratedOrders    = 0;

    // ── Checkouts ──────────────────────────────────────────────────────────────
    const oldCheckouts = await redis.get("checkouts");
    if (Array.isArray(oldCheckouts) && oldCheckouts.length > 0) {
      for (const c of oldCheckouts) {
        const key = c.session_id || `sess_${c.id || Date.now()}`;
        await redis.hset("chk_h", { [key]: c });
        migratedCheckouts++;
      }
      await redis.rename("checkouts", "checkouts_backup");
    }

    // ── Orders ─────────────────────────────────────────────────────────────────
    const oldOrders = await redis.get("orders");
    if (Array.isArray(oldOrders) && oldOrders.length > 0) {
      for (const o of oldOrders) {
        const key = o.order_id || `order_${o.id || Date.now()}`;
        await redis.hset("ord_h", { [key]: o });
        migratedOrders++;
      }
      await redis.rename("orders", "orders_backup");
    }

    return NextResponse.json({
      ok: true,
      migratedCheckouts,
      migratedOrders,
      message: `Migration terminée : ${migratedCheckouts} paniers + ${migratedOrders} commandes récupérés`,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
