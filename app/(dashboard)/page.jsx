import KpiCard from "@/components/KpiCard";
import { RevenueAreaChart, OrdersBarChart } from "@/components/RevenueChart";
import { dbGetStats, dbGetOrders, dbGetCheckouts } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function rateTag(rate, type) {
  const r = parseFloat(rate);
  const thresholds = type === "atc"
    ? [{ max: 3, label: "Mauvaise stat", bg: "#fee2e2", color: "#dc2626" },
       { max: 8, label: "Normale",       bg: "#fef9c3", color: "#ca8a04" },
       { max: 15, label: "Bonne stat",   bg: "#dcfce7", color: "#16a34a" },
       { max: Infinity, label: "Très bonne stat", bg: "#bbf7d0", color: "#15803d" }]
    : [{ max: 1, label: "Mauvaise stat", bg: "#fee2e2", color: "#dc2626" },
       { max: 3, label: "Normale",       bg: "#fef9c3", color: "#ca8a04" },
       { max: 6, label: "Bonne stat",    bg: "#dcfce7", color: "#16a34a" },
       { max: Infinity, label: "Très bonne stat", bg: "#bbf7d0", color: "#15803d" }];
  const t = thresholds.find(t => r < t.max);
  return t;
}

export default async function DashboardPage() {
  const { revenue, orders, visits, abandoned, converted, chart, visits24h, atc24h, payment24h } = await dbGetStats();
  const { rows: recent } = await dbGetOrders({ pageSize: 6 });
  const { rows: allCheckouts } = await dbGetCheckouts({ filter: "all", pageSize: 9999 });
  const convRate = converted + abandoned > 0 ? ((converted / (converted + abandoned)) * 100).toFixed(1) : "0.0";

  // Revenu potentiel des checkouts initiés non convertis
  const initiated = allCheckouts.filter(c => c.step === "payment_initiated" && !c.completed);
  const initiatedTotal = initiated.reduce((s, c) => s + (c.cart_total || 0), 0);
  const potential20 = initiatedTotal * 0.20;
  const potential40 = initiatedTotal * 0.40;
  const potential50 = initiatedTotal * 0.50;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base">Vue d&apos;ensemble</h1>
        <p className="text-sm text-muted mt-1">Toutes les données de votre boutique en temps réel.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Chiffre d'affaires" value={`${fmt(revenue)} €`} sub="Total des commandes payées" color="brand"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard label="Commandes" value={orders.toLocaleString("fr-FR")} sub="Commandes validées" color="green"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>}
        />
        <KpiCard label="Visites" value={visits.toLocaleString("fr-FR")} sub="Pages vues trackées" color="orange"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <KpiCard label="Taux de conversion" value={`${convRate} %`} sub={`${abandoned} paniers abandonnés`} color="red"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
        />
        <KpiCard label="Potentiel pessimiste" value={`${fmt(potential20)} €`} sub={`${initiated.length} checkouts × 20%`} color="orange"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
        />
        <KpiCard label="Potentiel réaliste" value={`${fmt(potential40)} €`} sub={`${initiated.length} checkouts × 40%`} color="purple"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
        />
        <KpiCard label="Potentiel max (non tracké)" value={`${fmt(potential50)} €`} sub={`${initiated.length} checkouts × 50%`} color="green"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
        />
      </div>

      {/* Conversion rates */}
      {visits24h > 0 && (() => {
        const atcRate  = ((atc24h / visits24h) * 100).toFixed(1);
        const payRate  = ((payment24h / visits24h) * 100).toFixed(1);
        const atcTag   = rateTag(atcRate, "atc");
        const payTag   = rateTag(payRate, "pay");
        return (
          <div className="card p-6">
            <p className="text-sm font-bold text-base mb-1">Taux de conversion — 24h</p>
            <p className="text-xs text-muted mb-5">Basé sur {visits24h} visites des dernières 24h</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Ajout au panier",     count: atc24h,     rate: atcRate, color: "#3b82f6", tag: atcTag },
                { label: "Arrivé au checkout",  count: payment24h, rate: payRate, color: "#8b5cf6", tag: payTag },
              ].map(({ label, count, rate, color, tag }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted">{label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xl font-black" style={{ color }}>{rate}%</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: tag.bg, color: tag.color }}>{tag.label}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-page overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, parseFloat(rate))}%`, background: color }} />
                  </div>
                  <span className="text-xs text-muted">{count} personne{count > 1 ? "s" : ""} sur {visits24h}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <p className="text-sm font-bold text-base mb-1">Revenu — 14 jours</p>
          <p className="text-xs text-muted mb-6">Chiffre d&apos;affaires journalier</p>
          <RevenueAreaChart data={chart} />
        </div>
        <div className="card p-6">
          <p className="text-sm font-bold text-base mb-1">Commandes — 14 jours</p>
          <p className="text-xs text-muted mb-6">Volume de commandes journalier</p>
          <OrdersBarChart data={chart} />
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-6">
        <p className="text-sm font-bold text-base mb-5">Dernières commandes</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base">
                {["ID", "Client", "Email", "Montant", "Statut", "Date"].map(h => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold text-muted uppercase tracking-wider pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted">
                  Aucune commande — envoyez des webhooks pour commencer.
                  <br/><span className="text-xs">POST http://localhost:4000/api/webhook/order</span>
                </td></tr>
              ) : recent.map((o) => (
                <tr key={o.id} className="border-b border-base last:border-0 hover:bg-page transition">
                  <td className="py-3 pr-6"><span className="text-xs font-mono text-muted">{o.order_id}</span></td>
                  <td className="py-3 pr-6 font-medium text-base">{o.name || "—"}</td>
                  <td className="py-3 pr-6 text-muted">{o.email}</td>
                  <td className="py-3 pr-6 font-semibold text-base">{fmt(o.total)} €</td>
                  <td className="py-3 pr-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{o.status}</span>
                  </td>
                  <td className="py-3 text-muted text-xs">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
