"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";

export default function AdminInventoryPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  /** Valor em edição no input de estoque (controlado). */
  const [localStock, setLocalStock] = useState<Record<string, number>>({});
  const [stockError, setStockError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "stock-asc" | "stock-desc">("price-asc");

  const fetchProducts = async () => {
    const res = await fetch("/api/admin/products", { credentials: "include" });
    if (res.status === 401) {
      router.replace(`/${locale}/admin`);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    fetchProducts()
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [router, locale]);

  const handleStockChange = (id: string, value: number) => {
    setStockError(null);
    setLocalStock((prev) => ({ ...prev, [id]: value }));
  };

  const handleStockBlur = async (id: string, value: number) => {
    const product = products.find((p) => p.id === id);
    const current = product?.stockQuantity ?? 0;
    if (!product || current === value) {
      setLocalStock((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setUpdatingId(id);
    setStockError(null);
    const res = await fetch("/api/admin/products/patch-stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, stock_quantity: Math.max(0, Math.floor(value)) }),
    });
    const data = res.ok ? null : await res.json().catch(() => ({}));
    setUpdatingId(null);
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockQuantity: value } : p)));
      setLocalStock((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setStockError(data?.error ?? "Failed to update stock");
    }
  };

  const handlePriceBlur = async (id: string, value: number) => {
    const product = products.find((p) => p.id === id);
    if (!product || product.priceUsd === value || value < 0) return;
    setUpdatingId(id);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, priceUsd: value }),
    });
    setUpdatingId(null);
    if (res.ok) setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, priceUsd: value } : p)));
  };

  const handleShippingChange = async (id: string, freeShipping: boolean) => {
    setUpdatingId(id);
    setStockError(null);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, free_shipping: freeShipping }),
    });
    setUpdatingId(null);
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, freeShipping } : p)));
    } else {
      const data = await res.json().catch(() => ({}));
      setStockError(data?.error ?? "Failed to update shipping");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-noir-600">{t("loading")}</p>
      </div>
    );
  }

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  const filteredProducts =
    categoryFilter === "all" ? products : products.filter((p) => p.category === categoryFilter);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.priceUsd - b.priceUsd;
      case "price-desc":
        return b.priceUsd - a.priceUsd;
      case "stock-asc":
        return (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0);
      case "stock-desc":
        return (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0);
      default:
        return 0;
    }
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">{t("inventory")}</h1>
        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
            >
              {t("addProduct")}
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
            >
              Settings
            </Link>
            <Link href="/collection" className="text-sm font-medium text-noir-600 hover:text-noir-900">
              {t("backToStore")}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-full border border-champagne-300 bg-white px-3 py-1.5 text-xs text-noir-700"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-full border border-champagne-300 bg-white px-3 py-1.5 text-xs text-noir-700"
            >
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="stock-desc">Stock: high to low</option>
              <option value="stock-asc">Stock: low to high</option>
            </select>
          </div>
        </div>
      </div>

      {stockError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{stockError}</p>
      )}
      <div className="overflow-hidden rounded-2xl border border-noir-900/10 bg-section">
        {products.length === 0 ? (
          <p className="p-8 text-center text-noir-600">{t("noProducts")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-noir-900/10 bg-white/80">
                  <th className="px-6 py-4 font-medium text-noir-700">Product</th>
                  <th className="px-6 py-4 font-medium text-noir-700">Category</th>
                  <th className="px-6 py-4 font-medium text-noir-700">Price</th>
                  <th className="px-6 py-4 font-medium text-noir-700">Stock</th>
                  <th className="px-6 py-4 font-medium text-noir-700">Shipping</th>
                  <th className="px-6 py-4 font-medium text-noir-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
              {sortedProducts.map((p) => {
                const allImages = (p.images && p.images.length > 0 ? p.images : [p.image]).filter(Boolean);
                const thumb = allImages[0] || p.image;
                const shortName = p.name.split(" ").slice(0, 3).join(" ");
                return (
                  <tr key={p.id} className="border-b border-noir-900/5 hover:bg-white/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {thumb && (
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white">
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              className="object-cover object-center"
                              sizes="48px"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-noir-900">{shortName}</div>
                          <div className="text-xs text-noir-500 truncate max-w-[180px]" title={p.name}>
                            {p.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-noir-600">{p.category}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        defaultValue={p.priceUsd}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isNaN(v)) handlePriceBlur(p.id, Math.max(0, v));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        disabled={updatingId === p.id}
                        className="w-24 rounded-xl border border-champagne-300 bg-white px-3 py-1.5 text-right text-noir-900 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        value={localStock[p.id] ?? p.stockQuantity ?? 0}
                        onChange={(e) => handleStockChange(p.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                        onBlur={(e) => handleStockBlur(p.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        disabled={updatingId === p.id}
                        className="w-20 rounded-xl border border-champagne-300 bg-white px-3 py-1.5 text-center text-noir-900 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={p.freeShipping ? "free" : "fixed"}
                        onChange={(e) => handleShippingChange(p.id, e.target.value === "free")}
                        disabled={updatingId === p.id}
                        className="rounded-xl border border-champagne-300 bg-white px-3 py-1.5 text-noir-900 disabled:opacity-60"
                      >
                        <option value="fixed">{t("shippingFixed")}</option>
                        <option value="free">{t("freeShipping")}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin?edit=${encodeURIComponent(p.id)}`}
                          className="rounded-full bg-noir-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-noir-800"
                        >
                          {t("edit")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="rounded-full border border-red-300 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          {t("delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
