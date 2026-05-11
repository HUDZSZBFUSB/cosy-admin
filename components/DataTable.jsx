"use client";
import { useState } from "react";

export default function DataTable({ columns, rows, loading, total, page, pageSize, onPage, onSearch, searchPlaceholder = "Rechercher…" }) {
  const [q, setQ] = useState("");
  const totalPages = Math.ceil((total || 0) / (pageSize || 20));

  function handleSearch(e) {
    e.preventDefault();
    onSearch?.(q);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-page border border-base text-sm text-base focus:outline-none focus:ring-2 transition"
            style={{"--tw-ring-color":"rgba(99,102,241,.4)"}}
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white transition" style={{ background: "rgb(var(--brand))" }}>
          Filtrer
        </button>
        <span className="text-xs text-muted ml-auto">{total} résultat{total !== 1 ? "s" : ""}</span>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted text-sm">Chargement…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted text-sm">Aucune donnée</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="border-b border-base last:border-0 hover:bg-page transition">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                        {col.render ? col.render(row[col.key], row) : (
                          <span className="text-sm text-base">{row[col.key] ?? "—"}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Page {page} sur {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPage?.(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-base text-muted hover:text-base disabled:opacity-40 transition">
              ← Préc.
            </button>
            <button onClick={() => onPage?.(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-base text-muted hover:text-base disabled:opacity-40 transition">
              Suiv. →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
