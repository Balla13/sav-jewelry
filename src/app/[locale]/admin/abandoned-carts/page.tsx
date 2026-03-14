"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingCart, Mail, Loader2 } from "lucide-react";

type AbandonedCart = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country_code: string | null;
  items: { productId?: string; name?: string; quantity?: number; priceUsd?: number }[];
  locale: string;
  created_at: string;
  email_sent_at: string | null;
};

export default function AdminAbandonedCartsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/abandoned-carts", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/admin`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.carts) setCarts(data.carts);
      })
      .catch(() => setCarts([]))
      .finally(() => setLoading(false));
  }, [router, locale]);

  const sendEmail = (id: string) => {
    setSendingId(id);
    fetch("/api/admin/abandoned-carts/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) {
          setCarts((prev) =>
            prev.map((c) => (c.id === id ? { ...c, email_sent_at: new Date().toISOString() } : c))
          );
        }
      })
      .finally(() => setSendingId(null));
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(locale === "es" ? "es" : "en-US", {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
    return s;
  };

  const formatAddress = (c: AbandonedCart) => {
    const parts = [c.address, [c.city, c.state, c.zip_code].filter(Boolean).join(", "), c.country_code].filter(Boolean);
    return parts.length ? parts.join(" · ") : "—";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-noir-400" />
        <p className="mt-4 text-noir-600">Loading abandoned carts…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">Abandoned carts</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
          >
            Dashboard
          </Link>
          <Link href="/collection" className="text-sm font-medium text-noir-600 hover:text-noir-900">
            Back to store
          </Link>
        </div>
      </div>

      <p className="mb-6 text-sm text-noir-600">
        Customers who started checkout but did not complete. You can re-send the abandoned cart email (with recovery link to their cart).
      </p>

      {carts.length === 0 ? (
        <div className="rounded-2xl border border-noir-900/10 bg-section p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-noir-300" />
          <p className="mt-4 font-medium text-noir-700">No abandoned carts</p>
          <p className="mt-1 text-sm text-noir-500">When someone leaves checkout without paying, they will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {carts.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-noir-900/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-noir-900">
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                  </p>
                  <p className="mt-0.5 text-sm text-noir-600">{c.email}</p>
                  {c.phone && <p className="text-sm text-noir-500">{c.phone}</p>}
                  <p className="mt-2 text-xs text-noir-500">{formatAddress(c)}</p>
                  <p className="mt-2 text-xs text-noir-400">
                    {c.items.length} item(s) · {c.locale} · {formatDate(c.created_at)}
                    {c.email_sent_at && (
                      <span className="ml-2 text-green-600">· Email sent {formatDate(c.email_sent_at)}</span>
                    )}
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-noir-600">
                    {c.items.slice(0, 5).map((i, idx) => (
                      <li key={idx}>
                        {i.name || "Item"} × {i.quantity ?? 1}
                        {i.priceUsd != null ? ` · $${i.priceUsd}` : ""}
                      </li>
                    ))}
                    {c.items.length > 5 && <li>…and {c.items.length - 5} more</li>}
                  </ul>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={`/${c.locale}/checkout?recover=${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
                  >
                    Open recovery link
                  </a>
                  <button
                    type="button"
                    onClick={() => sendEmail(c.id)}
                    disabled={sendingId === c.id}
                    className="inline-flex items-center gap-2 rounded-full bg-noir-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-noir-800 disabled:opacity-50"
                  >
                    {sendingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Send email
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
