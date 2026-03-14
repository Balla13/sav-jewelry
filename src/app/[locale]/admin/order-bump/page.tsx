"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import AdminNav from "@/components/AdminNav";
import { resolveOrderBumpImageSrc } from "@/lib/order-bump-image";

export default function AdminOrderBumpPage() {
  const router = useRouter();
  const locale = useLocale();
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState("SÁV+ Jewelry Cleaning Kit");
  const [description, setDescription] = useState("Keep your pieces radiant with our signature revival formula.");
  const [price, setPrice] = useState("29");
  const [compareAtPrice, setCompareAtPrice] = useState("49");
  const [imageUrl, setImageUrl] = useState("/Limpa Joias SAV.png");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/admin`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (typeof data.order_bump_enabled === "boolean") setEnabled(data.order_bump_enabled);
        if (data.order_bump_name) setName(data.order_bump_name);
        if (data.order_bump_description) setDescription(data.order_bump_description);
        if (data.order_bump_price_usd != null) setPrice(String(data.order_bump_price_usd));
        if (data.order_bump_compare_at_price_usd != null) setCompareAtPrice(String(data.order_bump_compare_at_price_usd));
        if (data.order_bump_image_url) setImageUrl(data.order_bump_image_url);
      })
      .catch(() => {});
  }, [router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          order_bump_enabled: enabled,
          order_bump_name: name.trim() || null,
          order_bump_description: description.trim() || null,
          order_bump_price_usd: Number(price) || 0,
          order_bump_compare_at_price_usd: compareAtPrice.trim() ? Number(compareAtPrice) || 0 : null,
          order_bump_image_url: imageUrl.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save");
      } else {
        setSuccess("Order bump updated.");
      }
    } catch (e) {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">Order bump</h1>
        <AdminNav />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-noir-900/10 bg-section p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-noir-800">Enable order bump</p>
            <p className="text-xs text-noir-500">
              Show this exclusive offer on the checkout page.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="text-xs text-noir-600">{enabled ? "On" : "Off"}</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-champagne-300 text-noir-900 focus:ring-noir-900"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-noir-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-noir-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-noir-700">Promo price (USD)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-noir-700">Compare-at price (USD)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-noir-700">Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/Limpa-Joias-SAV.png ou URL completa (evite espaços no caminho)"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
          />
          {imageUrl && (
            <div className="mt-3">
              <p className="text-xs text-noir-500 mb-1">Preview</p>
              <img
                src={resolveOrderBumpImageSrc(imageUrl)}
                alt="Preview"
                className="h-24 w-24 rounded-xl border border-noir-900/10 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-noir-900 py-3 text-sm font-medium text-white transition hover:bg-noir-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save order bump"}
        </button>
      </form>
    </div>
  );
}

