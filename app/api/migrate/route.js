import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Restaure les backups si la migration précédente avait renommé les clés
export async function GET() {
  try {
    let restored = [];

    // Restaure checkouts_backup -> checkouts si checkouts est vide/absent
    const backup = await redis.get("checkouts_backup");
    if (Array.isArray(backup) && backup.length > 0) {
      await redis.set("checkouts", backup);
      await redis.del("checkouts_backup");
      restored.push(`${backup.length} paniers restaurés`);
    }

    // Restaure orders_backup -> orders si orders est vide/absent
    const ordBackup = await redis.get("orders_backup");
    if (Array.isArray(ordBackup) && ordBackup.length > 0) {
      await redis.set("orders", ordBackup);
      await redis.del("orders_backup");
      restored.push(`${ordBackup.length} commandes restaurées`);
    }

    return NextResponse.json({
      ok: true,
      message: restored.length > 0 ? restored.join(", ") : "Rien à restaurer, données déjà en place",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
