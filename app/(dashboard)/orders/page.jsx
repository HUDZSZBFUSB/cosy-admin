"use client";
import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/DataTable";
import { fmtDate } from "@/lib/utils";

/* ── Confirmation modal ─────────────────────────────────────── */
function ConfirmModal({ order, onConfirm, onCancel }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      {/* Box */}
      <div className="relative card p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 shrink-0">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-base text-sm">Supprimer cette commande ?</p>
            <p className="text-xs text-muted mt-1">
              <span className="font-mono">{order.order_id}</span>
              {order.name ? ` · ${order.name}` : ""}
              {" · "}<strong>{Number(order.total).toFixed(2)} €</strong>
            </p>
            <p className="text-xs text-muted mt-1">Cette action est irréversible.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-base hover:bg-page transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function OrdersPage() {
  const [data, setData]       = useState({ rows: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [page, setPage]       = useState(1);
  const [toDelete, setToDelete] = useState(null); // order object awaiting confirmation
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (query = q, p = page) => {
    setLoading(true);
    const res = await fetch(`/api/orders?q=${encodeURIComponent(query)}&page=${p}`);
    setData(await res.json());
    setLoading(false);
  }, [q, page]);

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await fetch(`/api/orders/${toDelete.id}`, { method: "DELETE" });
    setToDelete(null);
    setDeleting(false);
    load(q, page);
  }

  const COLUMNS = [
    { key: "order_id", label: "ID",     render: (v) => <span className="text-xs font-mono text-muted">{v}</span> },
    { key: "name",     label: "Client", render: (v) => <span className="font-medium text-base">{v || "—"}</span> },
    { key: "email",    label: "Email",  render: (v) => <span className="text-muted">{v || "—"}</span> },
    {
      key: "items",
      label: "Articles",
      render: (v) => {
        try {
          const items = JSON.parse(v || "[]");
          return <span className="text-xs text-muted">{items.map(i => i.title || i.name || "Article").join(", ") || "—"}</span>;
        } catch { return <span className="text-muted">—</span>; }
      },
    },
    { key: "total",  label: "Total",  render: (v) => <span className="font-semibold text-base">{Number(v).toFixed(2)} €</span> },
    {
      key: "status",
      label: "Statut",
      render: (v) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          v === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-neutral-100 text-neutral-600"
        }`}>{v}</span>
      ),
    },
    { key: "created_at", label: "Date", render: (v) => <span className="text-xs text-muted">{fmtDate(v)}</span> },
    {
      key: "_actions",
      label: "",
      render: (_, row) => (
        <button
          onClick={() => setToDelete(row)}
          title="Supprimer"
          className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <>
      <ConfirmModal
        order={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base">Commandes</h1>
          <p className="text-sm text-muted mt-1">Historique complet des commandes reçues via webhook.</p>
        </div>
        <DataTable
          columns={COLUMNS}
          rows={data.rows}
          loading={loading || deleting}
          total={data.total}
          page={page}
          pageSize={data.pageSize}
          onPage={(p) => { setPage(p); load(q, p); }}
          onSearch={(s) => { setQ(s); setPage(1); load(s, 1); }}
          searchPlaceholder="Rechercher par email, nom, ID…"
        />
      </div>
    </>
  );
}
