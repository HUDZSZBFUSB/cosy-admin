"use client";
import { useState, useEffect, useCallback } from "react";

/* ── helpers ──────────────────────────────────────────────────── */
function fmtEur(n) {
  return Number(n || 0).toFixed(2).replace(".", ",") + " €";
}
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `il y a ${diff}s`;
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}
function parseItems(cart) {
  try { return JSON.parse(cart || "[]"); } catch { return []; }
}

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = "brand" }) {
  const colors = {
    brand:  "text-[rgb(var(--brand))]",
    green:  "text-green-500",
    blue:   "text-blue-500",
    purple: "text-purple-500",
  };
  return (
    <div className="card p-5 flex flex-col gap-1">
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className={`text-3xl font-black leading-none ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

/* ── Email Preview ────────────────────────────────────────────── */
function EmailPreview({ subject, senderName }) {
  return (
    <div className="rounded-xl overflow-hidden border border-base text-sm font-sans">
      {/* Email client header */}
      <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 flex items-center gap-3 border-b border-base">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <p className="text-xs text-muted flex-1 text-center">Aperçu de l'email</p>
      </div>

      {/* Email meta */}
      <div className="px-5 py-3 border-b border-base bg-surface">
        <p className="text-xs text-muted">De : <span className="font-medium text-base">{senderName} &lt;relance@cosy-corner.shop&gt;</span></p>
        <p className="text-xs text-muted mt-0.5">Objet : <span className="font-medium text-base">{subject}</span></p>
      </div>

      {/* Email body preview */}
      <div className="bg-[#f2f2f2] rounded-b-xl p-6">
        <div className="max-w-[400px] mx-auto bg-white shadow-xl rounded-sm overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-7 pb-5 border-b border-neutral-100">
            <p className="font-black text-[16px] tracking-[-0.5px] text-black leading-none">SCREENLAB</p>
          </div>

          {/* Hero texte */}
          <div className="px-8 pt-6 pb-5">
            <p className="text-[9px] font-semibold tracking-[2px] text-neutral-400 uppercase mb-2">Panier sauvegardé</p>
            <h2 className="font-black text-[17px] text-black leading-[1.2] tracking-[-0.5px] mb-2.5">
              Votre sélection<br/>vous attend.
            </h2>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Les articles que vous avez choisis sont toujours disponibles. Les stocks étant limités, nous ne pouvons pas les réserver indéfiniment.
            </p>
          </div>

          {/* Séparateur */}
          <div className="h-px bg-neutral-100 mx-8" />

          {/* Produit */}
          <div className="px-8 py-5 flex items-center gap-3">
            <div className="w-14 h-14 bg-neutral-100 rounded-sm shrink-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-black leading-tight">Votre article</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Variante sélectionnée</p>
              <p className="text-[12px] font-black text-black mt-1">XXX,XX €</p>
            </div>
          </div>

          {/* Séparateur */}
          <div className="h-px bg-neutral-100 mx-8" />

          {/* Total + CTA */}
          <div className="px-8 py-5">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wide font-semibold">Total</span>
              <span className="text-[18px] font-black text-black tracking-[-0.5px]">XXX,XX €</span>
            </div>
            <div className="bg-black text-white text-center py-3 rounded-sm text-[11px] font-black tracking-[1px] uppercase">
              Récupérer mon panier
            </div>
          </div>

          {/* Réassurance */}
          <div className="border-t border-neutral-100 px-8 py-4 grid grid-cols-3 gap-2">
            {[["Livraison", "gratuite"], ["Paiement", "sécurisé"], ["Retour", "30 jours"]].map(([l1, l2]) => (
              <div key={l1} className="text-center">
                <p className="text-[9px] font-semibold text-neutral-800 leading-tight">{l1}</p>
                <p className="text-[9px] text-neutral-400 leading-tight">{l2}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-100 px-8 py-4">
            <p className="text-[9px] text-neutral-300 text-center leading-relaxed">
              SCREENLAB · cosy-corner.shop<br/>
              <span className="underline cursor-pointer">Se désabonner</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Row relance envoyée ──────────────────────────────────────── */
function ReminderRow({ r, onResent }) {
  const [sending, setSending] = useState(false);
  const [resent,  setResent]  = useState(false);
  const [err,     setErr]     = useState(null);

  async function resend() {
    setSending(true); setErr(null);
    try {
      const res  = await fetch(`/api/send-reminder/${r.checkout_id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) setErr(json.error || "Erreur");
      else { setResent(true); onResent?.(); }
    } catch { setErr("Erreur réseau"); }
    finally { setSending(false); }
  }

  return (
    <tr className="border-b border-base hover:bg-page transition">
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-base">{r.name || "—"}</p>
        <p className="text-xs text-muted">{r.email}</p>
      </td>
      <td className="py-3 px-4 text-sm text-base">{fmtEur(r.cart_total)}</td>
      <td className="py-3 px-4 text-xs text-muted">{r.items_count} article{r.items_count > 1 ? "s" : ""}</td>
      <td className="py-3 px-4 text-xs text-muted">{timeAgo(r.sent_at)}</td>
      <td className="py-3 px-4">
        {r.converted ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            Converti
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            Envoyé
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={resend}
          disabled={sending || resent}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
            resent ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          } disabled:opacity-50`}
        >
          {resent ? "✓ Renvoyé" : sending ? "…" : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              Renvoyer
            </>
          )}
        </button>
        {err && <p className="text-[10px] text-red-500 mt-1">{err}</p>}
      </td>
    </tr>
  );
}

/* ── To-remind card ───────────────────────────────────────────── */
function ToRemindCard({ row, onSent }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [err, setErr]         = useState(null);
  const items = parseItems(row.cart);

  async function send() {
    setSending(true); setErr(null);
    try {
      const res  = await fetch(`/api/send-reminder/${row.id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) setErr(json.error || "Erreur");
      else { setSent(true); onSent?.(); }
    } catch { setErr("Erreur réseau"); }
    finally { setSending(false); }
  }

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-base truncate">{row.name || row.email}</p>
        <p className="text-xs text-muted truncate">{row.email}</p>
        <p className="text-xs text-muted mt-0.5">{items.length} article{items.length > 1 ? "s" : ""} · {fmtEur(row.cart_total)} · {timeAgo(row.updated_at || row.created_at)}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <button
          onClick={send}
          disabled={sending || sent}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            sent ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-blue-600 text-white hover:bg-blue-700"
          } disabled:opacity-60`}
        >
          {sent ? "✓ Envoyé" : sending ? "Envoi…" : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
              Envoyer
            </>
          )}
        </button>
        {err && <p className="text-[10px] text-red-500">{err}</p>}
      </div>
    </div>
  );
}

/* ── Send All Button ──────────────────────────────────────────── */
function SendAllButton({ toRemind, onDone }) {
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [progress, setProgress] = useState(0);

  async function sendAll() {
    setSending(true);
    setProgress(0);
    for (let i = 0; i < toRemind.length; i++) {
      await fetch(`/api/send-reminder/${toRemind[i].id}`, { method: "POST" });
      setProgress(i + 1);
      await new Promise(r => setTimeout(r, 300)); // petit délai entre chaque
    }
    setSending(false);
    setDone(true);
    onDone?.();
  }

  return (
    <div className="card p-4 flex items-center justify-between gap-4 border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10">
      <div>
        <p className="text-sm font-semibold text-base">
          {done ? "✅ Toutes les relances ont été envoyées !" : `${toRemind.length} panier${toRemind.length > 1 ? "s" : ""} en attente de relance`}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {done ? "Consultez l'historique ci-dessous" : "Envoyer un email de relance à tous les clients d'un coup"}
        </p>
        {sending && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(progress / toRemind.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted">{progress}/{toRemind.length}</span>
          </div>
        )}
      </div>
      {!done && (
        <button
          onClick={sendAll}
          disabled={sending}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
        >
          {sending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Envoi en cours…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
              Tout envoyer
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function RelancesPage() {
  const [data, setData]         = useState({ reminders: [], toRemind: [], stats: { totalSent: 0, totalConverted: 0, revenueRecov: 0, convRate: 0 } });
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("pending"); // "pending" | "history"

  const [subject]    = useState("Hey, ton panier t'attend ! 🛒");
  const [senderName] = useState("ScreenLab");

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/reminders");
      const json = await res.json();
      setData(json);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { stats, reminders, toRemind } = data;

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base">Relances email</h1>
        <p className="text-sm text-muted mt-1">Envoie des emails de relance aux clients avec un panier abandonné</p>
      </div>

      {/* Send all button */}
      {toRemind.length > 0 && (
        <SendAllButton toRemind={toRemind} onDone={load} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Relances envoyées"   value={stats.totalSent}      sub="Total cumulé"           color="blue"   />
        <StatCard label="Conversions"         value={stats.totalConverted} sub="Paniers récupérés"       color="green"  />
        <StatCard label="Taux de conversion"  value={`${stats.convRate}%`} sub="Relance → achat"        color="purple" />
        <StatCard label="Revenue récupéré"    value={fmtEur(stats.revenueRecov)} sub="Via relances"     color="brand"  />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Left — Template */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-base">Modèle d'email</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold">Actif</span>
          </div>

          {/* Config */}
          <div className="card p-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Expéditeur</label>
              <div className="input-base px-3 py-2 text-sm rounded-lg bg-page text-muted cursor-default">
                ScreenLab &lt;relance@cosy-corner.shop&gt;
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Objet de l'email</label>
              <div className="input-base px-3 py-2 text-sm rounded-lg bg-page text-base cursor-default">
                {subject}
              </div>
            </div>
          </div>

          <EmailPreview subject={subject} senderName={senderName} />
        </div>

        {/* Right — Paniers & Historique */}
        <div className="flex flex-col gap-4">

          {/* Tabs */}
          <div className="flex gap-1 bg-page p-1 rounded-xl">
            {[
              { id: "pending", label: `À relancer`, count: toRemind.length },
              { id: "history", label: "Historique",  count: reminders.length },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
                  tab === t.id ? "bg-surface text-base shadow-sm" : "text-muted hover:text-base"
                }`}
              >
                {t.label}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? "bg-[rgb(var(--brand))] text-white" : "bg-neutral-200 dark:bg-neutral-700 text-muted"
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Paniers à relancer */}
          {tab === "pending" && (
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="card p-8 text-center text-muted text-sm">Chargement…</div>
              ) : toRemind.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm font-semibold text-base">Tous les paniers ont été relancés !</p>
                  <p className="text-xs text-muted mt-1">Aucun panier en attente avec un email disponible</p>
                </div>
              ) : (
                toRemind.map(row => (
                  <ToRemindCard key={row.id} row={row} onSent={load} />
                ))
              )}
            </div>
          )}

          {/* Historique */}
          {tab === "history" && (
            <div className="card overflow-hidden">
              {reminders.length === 0 ? (
                <div className="p-10 text-center text-muted text-sm">Aucune relance envoyée pour l'instant</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-base">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted">Client</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted">Montant</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted">Articles</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted">Envoyé</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted">Statut</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map(r => <ReminderRow key={r.id} r={r} onResent={load} />)}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
