import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET() {
  try {
    const log = [];

    // Supprime les clés corrompues (type HASH au lieu de STRING)
    await redis.del("checkouts");
    await redis.del("orders");
    await redis.del("chk_h");
    await redis.del("ord_h");
    log.push("clés corrompues supprimées");

    // Restaure checkouts depuis le backup
    const chkBackup = await redis.get("checkouts_backup");
    if (Array.isArray(chkBackup) && chkBackup.length > 0) {
      await redis.set("checkouts", chkBackup);
      await redis.del("checkouts_backup");
      log.push(`${chkBackup.length} paniers restaurés`);
    } else {
      await redis.set("checkouts", []);
      log.push("checkouts réinitialisé vide");
    }

    // Restaure orders depuis le backup
    const ordBackup = await redis.get("orders_backup");
    if (Array.isArray(ordBackup) && ordBackup.length > 0) {
      await redis.set("orders", ordBackup);
      await redis.del("orders_backup");
      log.push(`${ordBackup.length} commandes restaurées`);
    } else {
      await redis.set("orders", []);
      log.push("orders réinitialisé vide");
    }

    return NextResponse.json({ ok: true, log });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
