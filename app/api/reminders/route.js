import { NextResponse } from "next/server";
import { dbGetReminders, dbGetCheckouts } from "@/lib/db";

export async function GET() {
  const reminders = await dbGetReminders();
  const { rows: allCheckouts } = await dbGetCheckouts({ filter: "abandoned", pageSize: 1000 });

  // Paniers avec email non encore relancés
  const toRemind = allCheckouts
    .filter(c => !c.completed && c.email && !c.reminded_at)
    .sort((a, b) => (b.updated_at || b.created_at) > (a.updated_at || a.created_at) ? 1 : -1);

  // Stats
  const totalSent      = reminders.length;
  const totalConverted = reminders.filter(r => r.converted).length;
  const revenueRecov   = reminders.filter(r => r.converted).reduce((s, r) => s + (r.cart_total || 0), 0);
  const convRate       = totalSent > 0 ? Math.round((totalConverted / totalSent) * 100) : 0;

  return NextResponse.json({ reminders, toRemind, stats: { totalSent, totalConverted, revenueRecov, convRate } });
}
