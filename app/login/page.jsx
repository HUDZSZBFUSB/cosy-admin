"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Identifiants incorrects.");
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 mb-4">
            <svg className="w-6 h-6 text-brand" style={{color:"rgb(var(--brand))"}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </span>
          <h1 className="text-xl font-bold text-base">Cosy Admin</h1>
          <p className="text-sm text-muted mt-1">Tableau de bord interne</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Identifiant</label>
            <input
              type="text"
              value={form.login}
              onChange={e => setForm(f => ({...f, login: e.target.value}))}
              placeholder="admin"
              className="w-full px-4 py-2.5 rounded-xl bg-page border border-base text-base text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition"
              style={{"--tw-ring-color":"rgba(99,102,241,.4)"}}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-page border border-base text-base text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition"
              required
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: "rgb(var(--brand))" }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          Login par défaut : <strong>admin</strong> / <strong>cosy2025</strong>
        </p>
      </div>
    </div>
  );
}
