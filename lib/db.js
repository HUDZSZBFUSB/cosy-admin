import { Redis } from "@upstash/redis";

// Upstash Redis — configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// dans les variables d'environnement Vercel.
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/* ─── Clés Redis ───────────────────────────────────────────────── */
const KEYS = {
  orders:    "cosy:orders",
  checkouts: "cosy:checkouts",
  pageviews: "cosy:pageviews",
  sessions:  "cosy:sessions",
  reminders: "cosy:reminders",
};

/* ─── Helpers lecture/écriture ───────────────────────────────── */
async function getList(key) {
  const data = await redis.get(key);
  return Array.isArray(data) ? data : [];
}

async function setList(key, list) {
  await redis.set(key, list);
}

/* ─── Orders ─────────────────────────────────────────────────── */
export async function dbInsertOrder(data) {
  const orders = await getList(KEYS.orders);
  const idx = orders.findIndex(o => o.order_id === data.order_id);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], ...data };
  } else {
    orders.push({ id: Date.now(), created_at: new Date().toISOString(), ...data });
  }
  await setList(KEYS.orders, orders);
}

export async function dbDeleteOrder(id) {
  const orders = await getList(KEYS.orders);
  await setList(KEYS.orders, orders.filter(o => String(o.id) !== String(id)));
}

export async function dbGetOrders({ q = "", page = 1, pageSize = 20 }) {
  let rows = [...(await getList(KEYS.orders))].reverse();
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(r =>
      r.email?.toLowerCase().includes(lq) ||
      r.name?.toLowerCase().includes(lq) ||
      r.order_id?.toLowerCase().includes(lq)
    );
  }
  const total = rows.length;
  rows = rows.slice((page - 1) * pageSize, page * pageSize);
  return { rows, total, page, pageSize };
}

/* ─── Checkouts ──────────────────────────────────────────────── */
export async function dbUpsertCheckout(data) {
  const checkouts = await getList(KEYS.checkouts);
  const idx = checkouts.findIndex(c => c.session_id === data.session_id);
  if (idx >= 0) {
    checkouts[idx] = { ...checkouts[idx], ...data, updated_at: new Date().toISOString() };
  } else {
    checkouts.push({ id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data });
  }
  await setList(KEYS.checkouts, checkouts);
}

export async function dbDeleteCheckout(id) {
  const checkouts = await getList(KEYS.checkouts);
  await setList(KEYS.checkouts, checkouts.filter(c => String(c.id) !== String(id)));
}

export async function dbGetCheckouts({ filter = "all", q = "", page = 1, pageSize = 20 }) {
  let rows = [...(await getList(KEYS.checkouts))].reverse();
  if (filter === "abandoned") rows = rows.filter(r => !r.completed);
  if (filter === "completed") rows = rows.filter(r => r.completed);
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(r => r.email?.toLowerCase().includes(lq) || r.name?.toLowerCase().includes(lq));
  }
  const total = rows.length;
  rows = rows.slice((page - 1) * pageSize, page * pageSize);
  return { rows, total, page, pageSize };
}

/* ─── Pageviews ──────────────────────────────────────────────── */
export async function dbInsertPageview(data) {
  const pageviews = await getList(KEYS.pageviews);
  pageviews.push({ id: Date.now(), created_at: new Date().toISOString(), ...data });
  // Garder seulement les 2 000 dernières pageviews pour éviter une liste infinie
  if (pageviews.length > 2000) pageviews.splice(0, pageviews.length - 2000);
  await setList(KEYS.pageviews, pageviews);
}

/* ─── Sessions live ──────────────────────────────────────────── */
export async function dbPingSession({ session_id, page, lat, lng, city, country }) {
  const sessions = await getList(KEYS.sessions);
  const now = new Date().toISOString();
  const geo = { lat: lat || null, lng: lng || null, city: city || "", country: country || "" };
  const idx = sessions.findIndex(s => s.session_id === session_id);
  if (idx >= 0) {
    sessions[idx].last_seen = now;
    sessions[idx].page = page || "/";
    if (lat) Object.assign(sessions[idx], geo);
  } else {
    sessions.push({ session_id, page: page || "/", last_seen: now, created_at: now, ...geo });
  }
  // Purge sessions inactives depuis 5 minutes
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const active = sessions.filter(s => s.last_seen > cutoff);
  await setList(KEYS.sessions, active);
}

export async function dbGetLive() {
  const [sessions, checkouts, pageviews] = await Promise.all([
    getList(KEYS.sessions),
    getList(KEYS.checkouts),
    getList(KEYS.pageviews),
  ]);

  const cutoff60 = new Date(Date.now() - 60 * 1000).toISOString();
  const active   = sessions.filter(s => s.last_seen > cutoff60);

  const pageMap = {};
  for (const s of active) {
    const p = s.page || "/";
    pageMap[p] = (pageMap[p] || 0) + 1;
  }
  const pages = Object.entries(pageMap)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);

  const cutoff10 = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent_atc = [...checkouts]
    .filter(c => c.created_at > cutoff10 || c.updated_at > cutoff10)
    .sort((a, b) => ((b.updated_at || b.created_at) > (a.updated_at || a.created_at) ? 1 : -1))
    .slice(0, 8);

  const recent_pageviews = [...pageviews]
    .filter(p => p.created_at > cutoff10)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    .slice(0, 8);

  return { count: active.length, pages, sessions: active, recent_atc, recent_pageviews };
}

/* ─── Stats globales ─────────────────────────────────────────── */
export async function dbGetStats() {
  const [orders, checkouts, pageviews] = await Promise.all([
    getList(KEYS.orders),
    getList(KEYS.checkouts),
    getList(KEYS.pageviews),
  ]);

  const paid     = orders.filter(o => o.status === "paid");
  const revenue  = paid.reduce((s, o) => s + (o.total || 0), 0);
  const abandoned  = checkouts.filter(c => !c.completed).length;
  const converted  = checkouts.filter(c => c.completed).length;
  const visits   = pageviews.length;

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = paid.filter(o => o.created_at?.slice(0, 10) === key);
    days.push({
      day: key.slice(5),
      revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
      orders: dayOrders.length,
    });
  }

  return { revenue, orders: paid.length, visits, abandoned, converted, chart: days };
}

/* ─── Customers ──────────────────────────────────────────────── */
export async function dbGetCustomers({ q = "", page = 1, pageSize = 20 }) {
  const orders = await getList(KEYS.orders);
  const paid   = orders.filter(o => o.status === "paid");

  const map = {};
  for (const o of paid) {
    const email = o.email || "inconnu";
    if (!map[email]) map[email] = { email, name: o.name || "", total: 0, orders: 0, last_order: o.created_at };
    map[email].total  += o.total || 0;
    map[email].orders += 1;
    if (o.created_at > map[email].last_order) map[email].last_order = o.created_at;
  }

  let rows = Object.values(map).sort((a, b) => b.total - a.total);
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(r => r.email.toLowerCase().includes(lq) || r.name.toLowerCase().includes(lq));
  }
  const total = rows.length;
  rows = rows.slice((page - 1) * pageSize, page * pageSize);
  return { rows, total, page, pageSize };
}

/* ─── Reminders ──────────────────────────────────────────────── */
export async function dbLogReminder({ checkout_id, email, name, cart_total, items_count }) {
  const reminders = await getList(KEYS.reminders);
  reminders.push({
    id: Date.now(),
    checkout_id: String(checkout_id),
    email,
    name: name || "",
    cart_total: cart_total || 0,
    items_count: items_count || 0,
    sent_at: new Date().toISOString(),
    converted: false,
  });
  await setList(KEYS.reminders, reminders);
}

export async function dbGetReminders() {
  const reminders = await getList(KEYS.reminders);
  return [...reminders].reverse();
}

export async function dbMarkReminderConverted(checkout_id) {
  const reminders = await getList(KEYS.reminders);
  await setList(KEYS.reminders, reminders.map(r =>
    r.checkout_id === String(checkout_id) ? { ...r, converted: true } : r
  ));
}

export async function dbMarkReminderConvertedByEmail(email) {
  if (!email) return;
  const reminders = await getList(KEYS.reminders);
  await setList(KEYS.reminders, reminders.map(r =>
    r.email === email ? { ...r, converted: true } : r
  ));
}
