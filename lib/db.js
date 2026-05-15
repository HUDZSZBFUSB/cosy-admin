import { Redis } from "@upstash/redis";

// ─── Client ───────────────────────────────────────────────────────────────────
// Lit UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN depuis les env vars
const redis = Redis.fromEnv();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function get(key) {
  const data = await redis.get(key);
  return data || [];
}

async function set(key, value) {
  await redis.set(key, value);
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function dbInsertOrder(data) {
  const orders = await get("orders");
  const idx = orders.findIndex(o => o.order_id === data.order_id);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], ...data };
  } else {
    orders.push({ id: Date.now(), created_at: new Date().toISOString(), ...data });
  }
  await set("orders", orders);
}

export async function dbGetOrders({ q = "", page = 1, pageSize = 20 }) {
  let rows = [...(await get("orders"))].reverse();
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

export async function dbDeleteOrder(id) {
  const orders = await get("orders");
  await set("orders", orders.filter(o => String(o.id) !== String(id)));
}

// ─── Checkouts (hash Redis — une clé par session, zéro race condition) ────────

export async function dbUpsertCheckout(data) {
  const session_id = data.session_id;
  if (!session_id) return;
  const existing = await redis.hget("checkouts", session_id);
  const record = existing
    ? { ...existing, ...data, updated_at: new Date().toISOString() }
    : { id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data };
  await redis.hset("checkouts", { [session_id]: record });
}

export async function dbGetCheckouts({ filter = "all", q = "", page = 1, pageSize = 20 }) {
  const all = await redis.hgetall("checkouts");
  let rows = all ? Object.values(all).sort((a, b) =>
    (b.updated_at || b.created_at) > (a.updated_at || a.created_at) ? 1 : -1
  ) : [];
  if (filter === "abandoned") rows = rows.filter(r => !r.completed);
  if (filter === "completed") rows = rows.filter(r => r.completed);
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(r =>
      r.email?.toLowerCase().includes(lq) ||
      r.name?.toLowerCase().includes(lq)
    );
  }
  const total = rows.length;
  rows = rows.slice((page - 1) * pageSize, page * pageSize);
  return { rows, total, page, pageSize };
}

export async function dbDeleteCheckout(sessionIdOrId) {
  // Essaie d'abord par session_id (clé du hash)
  const exists = await redis.hexists("checkouts", sessionIdOrId);
  if (exists) {
    await redis.hdel("checkouts", sessionIdOrId);
    return;
  }
  // Sinon cherche par id numérique
  const all = await redis.hgetall("checkouts");
  if (!all) return;
  const entry = Object.entries(all).find(([, v]) => String(v.id) === String(sessionIdOrId));
  if (entry) await redis.hdel("checkouts", entry[0]);
}

// ─── Pageviews ────────────────────────────────────────────────────────────────

export async function dbInsertPageview(data) {
  const pageviews = await get("pageviews");
  pageviews.push({ id: Date.now(), created_at: new Date().toISOString(), ...data });
  // Garde les 2000 dernières
  await set("pageviews", pageviews.slice(-2000));
}

// ─── Sessions (visiteurs live) ────────────────────────────────────────────────

export async function dbPingSession({ session_id, page, lat, lng, city, country }) {
  const sessions = await get("sessions");
  const now = new Date().toISOString();
  const idx = sessions.findIndex(s => s.session_id === session_id);
  const geo = { lat: lat || null, lng: lng || null, city: city || "", country: country || "" };

  if (idx >= 0) {
    sessions[idx].last_seen = now;
    sessions[idx].page = page || "/";
    if (lat) Object.assign(sessions[idx], geo);
  } else {
    sessions.push({ session_id, page: page || "/", last_seen: now, created_at: now, ...geo });
  }

  // Purge inactifs depuis 5 min
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const cleaned = sessions.filter(s => s.last_seen > cutoff);
  await set("sessions", cleaned);
}

export async function dbGetLive() {
  const [sessions, checkoutsHash, pageviews] = await Promise.all([
    get("sessions"),
    redis.hgetall("checkouts"),
    get("pageviews"),
  ]);
  const checkouts = checkoutsHash ? Object.values(checkoutsHash) : [];

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

  const cutoff10  = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const recent_atc = [...checkouts]
    .filter(c => c.created_at > cutoff10 || c.updated_at > cutoff10)
    .sort((a, b) => ((b.updated_at || b.created_at) > (a.updated_at || a.created_at) ? 1 : -1))
    .slice(0, 8);

  const recent_pageviews = [...pageviews]
    .filter(p => p.created_at > cutoff10)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    .slice(0, 8);

  const visits24h = pageviews.filter(p => p.created_at > cutoff24h).length;

  return { count: active.length, pages, sessions: active, recent_atc, recent_pageviews, visits24h };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function dbGetStats() {
  const [orders, checkouts, pageviews] = await Promise.all([
    get("orders"),
    get("checkouts"),
    get("pageviews"),
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

// ─── Customers ────────────────────────────────────────────────────────────────

export async function dbGetCustomers({ q = "", page = 1, pageSize = 20 }) {
  const orders = await get("orders");
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

// ─── Reminders ────────────────────────────────────────────────────────────────

export async function dbLogReminder({ checkout_id, email, name, cart_total, items_count }) {
  const reminders = await get("reminders");
  reminders.push({
    id: Date.now(),
    checkout_id: String(checkout_id),
    email, name: name || "",
    cart_total: cart_total || 0,
    items_count: items_count || 0,
    sent_at: new Date().toISOString(),
    converted: false,
  });
  await set("reminders", reminders);
}

export async function dbGetReminders() {
  return [...(await get("reminders"))].reverse();
}

export async function dbMarkReminderConverted(checkout_id) {
  const reminders = await get("reminders");
  await set("reminders", reminders.map(r =>
    r.checkout_id === String(checkout_id) ? { ...r, converted: true } : r
  ));
}

export async function dbMarkReminderConvertedByEmail(email) {
  if (!email) return;
  const reminders = await get("reminders");
  await set("reminders", reminders.map(r =>
    r.email === email ? { ...r, converted: true } : r
  ));
}
