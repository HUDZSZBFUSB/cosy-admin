"use client";
import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/DataTable";
import { fmtDate } from "@/lib/utils";

const COLUMNS = [
  {
    key: "email",
    label: "Email",
    render: (v) => (
      <span className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "rgb(var(--brand))" }}>
          {(v || "?")[0].toUpperCase()}
        </span>
        <span className="font-medium text-base">{v || "—"}</span>
      </span>
    ),
  },
  { key: "name",   label: "Nom",      render: (v) => <span className="text-muted">{v || "—"}</span> },
  { key: "total",  label: "LTV",      render: (v) => <span className="font-semibold text-base">{Number(v || 0).toFixed(2)} €</span> },
  { key: "orders", label: "Commandes",render: (v) => <span className="font-medium text-base">{v}</span> },
  { key: "last_order", label: "Dernière commande", render: (v) => <span className="text-xs text-muted">{fmtDate(v)}</span> },
];

export default function CustomersPage() {
  const [data, setData]     = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);

  const load = useCallback(async (query = q, p = page) => {
    setLoading(true);
    const res = await fetch(`/api/customers?q=${encodeURIComponent(query)}&page=${p}`);
    setData(await res.json());
    setLoading(false);
  }, [q, page]);

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base">Clients</h1>
        <p className="text-sm text-muted mt-1">Base de données clients agrégée depuis les commandes.</p>
      </div>
      <DataTable
        columns={COLUMNS} rows={data.rows} loading={loading}
        total={data.total} page={page} pageSize={20}
        onPage={(p) => { setPage(p); load(q, p); }}
        onSearch={(s) => { setQ(s); setPage(1); load(s, 1); }}
        searchPlaceholder="Rechercher un client…"
      />
    </div>
  );
}
