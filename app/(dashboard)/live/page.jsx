"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

/* ── Globe — client only ─────────────────────────────────────── */
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#7ececa55", borderTopColor: "#7ececa" }} />
    </div>
  ),
});

/* ── helpers ─────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 5)   return "À l'instant";
  if (s < 60)  return `il y a ${s}s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)}min`;
  return `il y a ${Math.floor(s / 3600)}h`;
}

function pageLabel(p) {
  if (!p || p === "/") return "Accueil";
  const map = {
    "/products/bubble-sofa-mini":     "Bubble Mini",
    "/products/bubble-sofa-3-places": "Bubble 3 Places",
    "/products/fauteuil-nuage-rond":  "Nuage Rond",
    "/products/leviya-tv":            "Leviya TV",
    "/contact":                       "Contact",
  };
  return map[p] || p;
}

function parseItems(c) {
  try { return JSON.parse(c || "[]"); } catch { return []; }
}

/* ── Mini sparkline (SVG) ────────────────────────────────────── */
function Spark({ color = "#3b82f6" }) {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none">
      <polyline
        points="0,24 12,20 24,22 36,14 48,18 60,8 72,12 80,4"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, spark, sparkColor }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <p className="text-xs text-muted font-medium">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-black text-base leading-none">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        {spark && <Spark color={sparkColor} />}
      </div>
    </div>
  );
}

/* ── Location bar ────────────────────────────────────────────── */
function LocBar({ label, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted truncate max-w-[180px]">{label}</span>
        <span className="text-xs font-semibold text-base ml-2 shrink-0">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-page overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#3b82f6" }} />
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function LivePage() {
  const [data, setData]     = useState({ count: 0, pages: [], sessions: [], recent_atc: [], recent_pageviews: [] });
  const [countries, setCountries] = useState({ features: [] });
  const [lastUp, setLastUp] = useState(null);
  const [connected, setConnected] = useState(false);
  const containerRef        = useRef(null);
  const [dims, setDims]     = useState({ w: 700, h: 700 });
  const globeRef            = useRef(null);

  /* Fetch GeoJSON countries once */
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then(r => r.json())
      .then(setCountries)
      .catch(() => {});
  }, []);

  /* SSE — server pushes every 2s, instant on new visitor */
  useEffect(() => {
    const es = new EventSource("/api/live/stream");

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
        setLastUp(new Date());
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects after error
    };

    return () => es.close();
  }, []);

/* Responsive globe size */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries)
        setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    setDims({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
    return () => ro.disconnect();
  }, []);

  /* Globe data */
  const points = (data.sessions || [])
    .filter(s => s.lat && s.lng)
    .map(s => ({
      lat:     s.lat,
      lng:     s.lng,
      city:    s.city || "Visiteur",
      country: s.country || "",
      page:    pageLabel(s.page),
    }));

  /* Stats derived */
  const atcCount      = (data.sessions || []).filter(s => {
    const co = (data.recent_atc || []).find(c => c.session_id === s.session_id);
    return !!co;
  }).length;
  const payCount      = (data.recent_atc || []).filter(c => c.step === "payment_initiated").length;
  const convCount     = (data.recent_atc || []).filter(c => c.completed).length;
  const totalRevenue  = (data.recent_atc || []).filter(c => c.completed).reduce((s, c) => s + (c.cart_total || 0), 0);
  const maxPg         = data.pages?.[0]?.count || 1;

  /* Location stats from sessions */
  const locationMap = {};
  for (const s of (data.sessions || [])) {
    if (!s.lat) continue;
    const key = [s.country, s.city].filter(Boolean).join(" · ") || "Inconnu";
    locationMap[key] = (locationMap[key] || 0) + 1;
  }
  const locations = Object.entries(locationMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxLoc = locations[0]?.count || 1;

  return (
    <div className="live-page flex h-[calc(100vh-64px)] gap-0 overflow-hidden">

      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className="w-[480px] shrink-0 flex flex-col gap-4 p-6 border-r border-base overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
          </svg>
          <span className="text-sm font-bold text-base">Vue en direct</span>
          <span className={`flex items-center gap-1.5 ml-1 text-[11px] font-medium ${connected ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
            <span className="relative flex h-2 w-2">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? "bg-green-500" : "bg-yellow-500"}`} />
            </span>
            {connected ? (lastUp ? timeAgo(lastUp.toISOString()) : "Connecté") : "Reconnexion…"}
          </span>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Visiteurs en ce moment"
            value={data.count}
            spark sparkColor="#3b82f6"
          />
          <StatCard
            label="Ventes totales"
            value={`${totalRevenue.toFixed(2).replace(".", ",")} €`}
            sub={convCount > 0 ? `${convCount} commande${convCount > 1 ? "s" : ""}` : "—"}
            spark sparkColor="#3b82f6"
          />
          <StatCard
            label="Visites"
            value={(data.recent_pageviews?.length || 0).toString()}
            sub="10 dernières minutes"
            spark sparkColor="#3b82f6"
          />
          <StatCard
            label="Pages actives"
            value={(data.pages?.length || 0).toString()}
            sub="URLs uniques"
            spark sparkColor="#3b82f6"
          />
        </div>

        {/* Funnel */}
        <div className="card p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-base">Comportement des clients</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Paniers actifs",   val: atcCount  },
              { label: "Au paiement",      val: payCount  },
              { label: "Achat effectué",   val: convCount },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-[22px] font-black text-base leading-none">{val}</p>
                <p className="text-[11px] text-muted mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Funnel bar */}
          <div className="flex items-end gap-1 h-14 mt-1 overflow-hidden">
            {[atcCount, payCount, convCount].map((v, i) => {
              const maxV = Math.max(atcCount, payCount, convCount, 1);
              const pct  = Math.min(100, Math.max(8, (v / maxV) * 100));
              return (
                <div key={i} className="flex-1 rounded-sm transition-all duration-700"
                  style={{ height: `${pct}%`, background: `rgba(59,130,246,${1 - i * 0.25})` }} />
              );
            })}
          </div>
        </div>

        {/* Pages actives */}
        <div className="card p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-base">Pages actives</p>
          {data.pages?.length === 0 ? (
            <p className="text-xs text-muted">Aucun visiteur actif</p>
          ) : data.pages?.map(({ page, count }) => (
            <LocBar key={page} label={pageLabel(page)} count={count} max={maxPg} />
          ))}
        </div>

        {/* Visits by location */}
        {locations.length > 0 && (
          <div className="card p-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-base">Visites par emplacement</p>
            {locations.map(({ label, count }) => (
              <LocBar key={label} label={label} count={count} max={maxLoc} />
            ))}
          </div>
        )}

      </div>

      {/* ── Globe ──────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at 55% 50%, #b2f0ee 0%, #c8f0f0 20%, #daf4f4 40%, #edfafa 65%, #f5fffe 100%)",
        }}
      >

        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}

          /* White/light globe surface via 1x1 white PNG data URI */
          globeImageUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23e8f4f8'/%3E%3C/svg%3E"
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={false}

          onGlobeReady={() => {
            const g = globeRef.current;
            if (!g) return;
            const ctrl = g.controls?.();
            if (ctrl) {
              ctrl.autoRotate      = true;
              ctrl.autoRotateSpeed = 0.5;
              ctrl.enableZoom      = false;
            }
            g.pointOfView?.({ lat: 30, lng: 15, altitude: 1.8 }, 1000);
          }}

          /* Teal hex continents */
          hexPolygonsData={countries.features}
          hexPolygonResolution={3}
          hexPolygonMargin={0.25}
          hexPolygonColor={() => "rgba(45,212,191,0.65)"}
          hexPolygonAltitude={0.003}

          /* Hexagone exact du visiteur — bons props */
          hexBinPointsData={points}
          hexBinPointLat={d => d.lat}
          hexBinPointLng={d => d.lng}
          hexBinResolution={3}
          hexMargin={0.25}
          hexAltitude={0.008}
          hexTopColor={() => "#1d4ed8"}
          hexSideColor={() => "#1d4ed8"}
          hexLabel={d => {
            const cities = [...new Set(d.points.map(p => p.city).filter(Boolean))];
            const country = d.points[0]?.country || "";
            const label = cities.length > 0 ? cities.join(", ") : country || "Visiteur";
            const count = d.points.length;
            return `<div style="background:rgba(15,23,42,0.9);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;font-family:sans-serif;white-space:nowrap;pointer-events:none">
              <strong>${label}</strong>${count > 1 ? `<span style="color:#94a3b8;margin-left:6px">${count} visiteurs</span>` : ""}
            </div>`;
          }}
        />
      </div>

    </div>
  );
}
