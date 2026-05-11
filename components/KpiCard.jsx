export default function KpiCard({ label, value, sub, icon, trend, color = "brand" }) {
  const colors = {
    brand:  { bg: "rgba(99,102,241,.1)",  text: "rgb(99,102,241)" },
    green:  { bg: "rgba(34,197,94,.1)",   text: "rgb(34,197,94)" },
    orange: { bg: "rgba(249,115,22,.1)",  text: "rgb(249,115,22)" },
    red:    { bg: "rgba(239,68,68,.1)",   text: "rgb(239,68,68)" },
  };
  const c = colors[color] || colors.brand;

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
        <span className="flex items-center justify-center w-9 h-9 rounded-xl text-sm" style={{ background: c.bg, color: c.text }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-base">{value}</p>
        {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-muted">vs hier</span>
        </div>
      )}
    </div>
  );
}
