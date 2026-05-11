"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ── helpers ─────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)  return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function parseItems(cart) {
  try { return JSON.parse(cart || "[]"); } catch { return []; }
}

function fmtEur(n) {
  return Number(n || 0).toFixed(2).replace(".", ",") + " €";
}

/* ── Cart Card ───────────────────────────────────────────────── */
function CartCard({ row, type, onDelete }) {
  const items = parseItems(row.cart);
  const isAtc = type === "atc";
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(!!row.reminded_at);
  const [error, setError]     = useState(null);

  async function handleSendReminder() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/send-reminder/${row.id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Erreur"); }
      else { setSent(true); }
    } catch { setError("Erreur réseau"); }
    finally { setSending(false); }
  }

  return (
    <div className={`card p-5 flex flex-col gap-4 border-l-4 ${isAtc ? "border-l-orange-400" : "border-l-purple-400"}`}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {isAtc ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                Panier abandonné
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse" />
                Checkout abandonné
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">{timeAgo(row.updated_at || row.created_at)}</p>
        </div>

        <div className="flex items-start gap-2 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-base">{fmtEur(row.cart_total)}</p>
            <p className="text-[11px] text-muted">{items.length} article{items.length > 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => onDelete(row.id)}
            className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition mt-0.5"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              {it.image && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={it.image}
                  alt=""
                  className="w-9 h-9 rounded-md object-cover shrink-0 bg-neutral-100"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base leading-tight truncate">
                  {it.title || it.name || "Article"}
                </p>
                {it.variant && (
                  <p className="text-[11px] text-muted">
                    {it.variant}
                    {it.swatch && (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full ml-1.5 border border-neutral-300 align-middle"
                        style={{ backgroundColor: it.swatch }}
                      />
                    )}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-base">
                  {it.qty && it.qty > 1 ? `×${it.qty} ` : ""}{fmtEur((it.price || 0) * (it.qty || 1))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-3 border-t border-base">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted font-mono truncate max-w-[160px]">
            {row.session_id}
          </p>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            isAtc
              ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20"
              : "bg-purple-50 text-purple-600 dark:bg-purple-900/20"
          }`}>
            {isAtc ? "Jamais cliqué Commander" : "Parti au checkout"}
          </span>
        </div>

        {/* Bouton relance */}
        <div className="flex flex-col gap-1">
          {row.email ? (
            <button
              onClick={handleSendReminder}
              disabled={sending || sent}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                sent
                  ? "bg-green-50 text-green-600 dark:bg-green-900/20 cursor-default"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
              } disabled:opacity-60`}
            >
              {sent ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Relance envoyée
                </>
              ) : sending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Envoi en cours…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Envoyer relance à {row.email}
                </>
              )}
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-neutral-100 text-muted dark:bg-neutral-800 cursor-not-allowed select-none">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Pas d'email — relance impossible
            </div>
          )}
          {error && <p className="text-[11px] text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function PaniersPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tick, setTick]       = useState(0);
  const intervalRef           = useRef(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/checkouts?filter=abandoned&pageSize=200&page=1");
      const json = await res.json();
      setRows(json.rows || []);
      setLastUpdate(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await fetch(`/api/checkouts/${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => {
      load();
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  // Split carts: never went to checkout vs. started checkout
  const atcOnly     = rows.filter((r) => r.step === "add_to_cart");
  const inCheckout  = rows.filter((r) => r.step === "payment_initiated");

  const totalRevAtRisk = rows.reduce((s, r) => s + (r.cart_total || 0), 0);

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-base">Paniers en temps réel</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-sm text-muted">
            Mis à jour toutes les 15 secondes
            {lastUpdate && (
              <span className="ml-2 text-muted/60">· {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            )}
          </p>
        </div>

        {/* Global stats */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="card px-5 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-black text-base">{rows.length}</p>
            <p className="text-[11px] text-muted mt-0.5">paniers ouverts</p>
          </div>
          <div className="card px-5 py-3 text-center min-w-[120px]">
            <p className="text-2xl font-black" style={{ color: "rgb(var(--brand))" }}>{fmtEur(totalRevAtRisk)}</p>
            <p className="text-[11px] text-muted mt-0.5">revenus à récupérer</p>
          </div>
        </div>
      </div>

      {loading && rows.length === 0 && (
        <div className="flex items-center justify-center py-20 text-muted text-sm">
          <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Chargement…
        </div>
      )}

      {/* ── Section 1 : Paniers ATC uniquement (jamais cliqué Commander) ─ */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <h2 className="text-base font-bold text-base">Ajoutés au panier — jamais commandé</h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            {atcOnly.length}
          </span>
          {atcOnly.length > 0 && (
            <span className="text-xs text-muted ml-auto">
              {fmtEur(atcOnly.reduce((s, r) => s + (r.cart_total || 0), 0))} en jeu
            </span>
          )}
        </div>

        {atcOnly.length === 0 ? (
          <div className="card p-10 text-center text-muted text-sm">
            {loading ? "Chargement…" : "Aucun panier abandonné pour l'instant 🎉"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {atcOnly.map((row) => (
              <CartCard key={row.session_id} row={row} type="atc" onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2 : Checkout initié mais pas finalisé ─────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <h2 className="text-base font-bold text-base">Checkout initié — paiement abandonné</h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            {inCheckout.length}
          </span>
          {inCheckout.length > 0 && (
            <span className="text-xs text-muted ml-auto">
              {fmtEur(inCheckout.reduce((s, r) => s + (r.cart_total || 0), 0))} en jeu
            </span>
          )}
        </div>

        {inCheckout.length === 0 ? (
          <div className="card p-10 text-center text-muted text-sm">
            {loading ? "Chargement…" : "Aucun checkout abandonné pour l'instant 🎉"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inCheckout.map((row) => (
              <CartCard key={row.session_id} row={row} type="checkout" onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
