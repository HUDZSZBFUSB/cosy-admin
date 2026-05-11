"use client";
import { useEffect, useRef, useState } from "react";

function playBip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Note 1
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.connect(g1); g1.connect(ctx.destination);
    o1.frequency.value = 880;
    o1.type = "sine";
    g1.gain.setValueAtTime(0, ctx.currentTime);
    g1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    g1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
    o1.start(ctx.currentTime);
    o1.stop(ctx.currentTime + 0.18);

    // Note 2
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.connect(g2); g2.connect(ctx.destination);
    o2.frequency.value = 1100;
    o2.type = "sine";
    g2.gain.setValueAtTime(0, ctx.currentTime + 0.2);
    g2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.21);
    g2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.42);
    o2.start(ctx.currentTime + 0.2);
    o2.stop(ctx.currentTime + 0.42);
  } catch { /* silent */ }
}

function showBrowserNotif(order) {
  if (Notification.permission === "granted") {
    new Notification("🛍️ Nouvelle commande !", {
      body: `${order.name || "Client"} · ${Number(order.total || 0).toFixed(2).replace(".", ",")} €`,
      icon: "/favicon.ico",
      tag: "order-" + order.id,
    });
  }
}

export default function OrderNotifier() {
  const countRef   = useRef(null);
  const [toast, setToast] = useState(null);

  // Demander permission notifications navigateur
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    async function check() {
      try {
        // Vérifie si un nouveau Purchase TikTok est arrivé via le tracker local
        const ttRes  = await fetch("/api/tiktok-poll");
        const ttJson = await ttRes.json();

        if (ttJson.newPurchase) {
          playBip();
          const fakeOrder = { name: "Client TikTok", total: 0 };
          showBrowserNotif(fakeOrder);
          setToast({ ...fakeOrder, source: "tiktok" });
          setTimeout(() => setToast(null), 6000);
        }

        // Poll aussi les commandes DB classiques
        const res  = await fetch("/api/orders?pageSize=50&page=1");
        const json = await res.json();
        const paid = (json.rows || []).filter(r => r.status === "paid" && r.source !== "tiktok");
        const count = paid.length;

        if (countRef.current !== null && count > countRef.current) {
          const newOrders = paid.slice(0, count - countRef.current);
          newOrders.forEach(o => {
            playBip();
            showBrowserNotif(o);
            setToast(o);
            setTimeout(() => setToast(null), 5000);
          });
        }
        countRef.current = count;
      } catch { /* silent */ }
    }

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-800 rounded-2xl shadow-2xl px-5 py-4 min-w-[280px]">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0 text-xl">
          🛍️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-base">Nouvelle commande !</p>
          <p className="text-xs text-muted mt-0.5 truncate">
            {toast.source === "tiktok" ? (
              <span className="font-semibold text-green-600">Vente détectée via TikTok 🎯</span>
            ) : (
              <>{toast.name || "Client"} · <span className="font-semibold text-green-600">{Number(toast.total || 0).toFixed(2).replace(".", ",")} €</span></>
            )}
          </p>
        </div>
        <button onClick={() => setToast(null)} className="text-muted hover:text-base shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
