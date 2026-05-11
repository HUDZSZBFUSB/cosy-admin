"use client";
import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/DataTable";
import { fmtDate } from "@/lib/utils";

const STEPS = {
  add_to_cart:        { label: "Ajout panier",  color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  payment_initiated:  { label: "Checkout",      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  initiated:          { label: "Initié",        color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
  email:              { label: "Email",         color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  shipping:           { label: "Livraison",     color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  payment:            { label: "Paiement",      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  completed:          { label: "Complété",      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

const COLUMNS = [
  {
    key: "email",
    label: "Email",
    render: (v) => <span className="font-medium text-base">{v || "—"}</span>,
  },
  {
    key: "name",
    label: "Nom",
    render: (v) => <span className="text-muted">{v || "—"}</span>,
  },
  {
    key: "cart_total",
    label: "Panier",
    render: (v) => <span className="font-semibold text-base">{Number(v || 0).toFixed(2)} €</span>,
  },
  {
    key: "cart",
    label: "Articles",
    render: (v) => {
      try {
        const items = JSON.parse(v || "[]");
        return (
          <span className="text-xs text-muted">
            {items.map((i) => i.title || i.name || "Article").join(", ") || "—"}
          </span>
        );
      } catch { return <span className="text-muted">—</span>; }
    },
  },
  {
    key: "step",
    label: "Étape d'arrêt",
    render: (v, row) => {
      if (row.completed) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✓ Complété</span>;
      }
      const s = STEPS[v] || STEPS.initiated;
      return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
    },
  },
  {
    key: "completed",
    label: "Statut",
    render: (v) => v
      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Converti</span>
      : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Abandonné</span>,
  },
  {
    key: "created_at",
    label: "Date",
    render: (v) => <span className="text-xs text-muted">{fmtDate(v)}</span>,
  },
];

export default function CheckoutsPage() {
  const [data, setData]     = useState({ rows: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);

  const load = useCallback(async (f = filter, query = q, p = page) => {
    setLoading(true);
    const res = await fetch(`/api/checkouts?filter=${f}&q=${encodeURIComponent(query)}&page=${p}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [filter, q, page]);

  useEffect(() => { load(); }, []);

  function applyFilter(f) {
    setFilter(f); setPage(1);
    load(f, q, 1);
  }

  function handleSearch(query) {
    setQ(query); setPage(1);
    load(filter, query, 1);
  }

  function handlePage(p) {
    setPage(p);
    load(filter, q, p);
  }

  const tabs = [
    { key: "all",       label: "Tous" },
    { key: "abandoned", label: "Abandonnés" },
    { key: "completed", label: "Convertis" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base">Analyse des Checkouts</h1>
        <p className="text-sm text-muted mt-1">Suivez chaque étape d&apos;achat et identifiez les abandons.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 card self-start rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => applyFilter(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === t.key ? "text-white shadow-sm" : "text-muted hover:text-base"
            }`}
            style={filter === t.key ? { background: "rgb(var(--brand))" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data.rows}
        loading={loading}
        total={data.total}
        page={page}
        pageSize={data.pageSize}
        onPage={handlePage}
        onSearch={handleSearch}
        searchPlaceholder="Rechercher par email ou nom…"
      />
    </div>
  );
}
