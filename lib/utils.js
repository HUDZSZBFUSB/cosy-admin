export function fmt(n, decimals = 2) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n ?? 0);
}

export function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}
