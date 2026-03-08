"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/check", { credentials: "include" })
      .then((res) => setAuthenticated(res.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) setAuthenticated(true);
    else setError(data.error || "Login failed");
  };

  if (authenticated === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-noir-600">{t("loading")}</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="font-display text-2xl font-semibold text-noir-900">{t("login")}</h1>
        <p className="mt-2 text-sm text-noir-500">Sessão válida por 10 minutos.</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-noir-700">
              {t("password")}
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-noir-900 py-2.5 text-sm font-medium text-white transition hover:bg-noir-800 hover:shadow-lg"
          >
            {t("submitLogin")}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
