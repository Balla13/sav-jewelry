"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/data/products";

export default function AdminInventoryPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/admin`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) setProducts(data);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [router, locale]);

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">{t("inventory")}</h1>
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
      </div>

      <div className="overflow-hidden rounded-2xl border border-noir-900/10 bg-section">
        {products.length === 0 ? (
          <p className="p-8 text-center text-noir-600">{t("noProducts")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-noir-900/10 bg-white/80">
                  <th className="w-16 px-4 py-4 font-medium text-noir-700"> </th>
                  <th className="px-6 py-4 font-medium text-noir-700">Product</th>
                  <th className="px-6 py-4 font-medium text-noir-700">Category</th>
                  <th className="px-6 py-4 font-medium text-noir-700">Price</th>
                  <th className="px-6 py-4 font-medium text-noir-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const thumb = p.images?.[0] ?? p.image ?? "";
                  return (
                  <tr key={p.id} className="border-b border-noir-900/5 hover:bg-white/50">
                    <td className="w-16 px-4 py-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover bg-noir-100"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <span className="inline-block h-12 w-12 rounded-lg bg-noir-100" />
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-noir-900">{p.name}</td>
                    <td className="px-6 py-4 text-noir-600">{p.category}</td>
                    <td className="px-6 py-4 text-noir-900">${p.priceUsd}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
