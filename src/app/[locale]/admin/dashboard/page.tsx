"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import AdminNav from "@/components/AdminNav";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { formatPrice } from "@/data/products";

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  topProducts: { productId: string; name: string; quantitySold: number }[];
  message?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/admin`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => setStats({ totalRevenue: 0, totalOrders: 0, topProducts: [] }))
      .finally(() => setLoading(false));
  }, [router, locale]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-noir-600">Loading dashboard...</p>
      </div>
    );
  }

  const s = stats || { totalRevenue: 0, totalOrders: 0, topProducts: [] };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">Dashboard</h1>
        <AdminNav />
      </div>

      {s.message && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {s.message}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-noir-900/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gold/10 p-3">
              <DollarSign className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-label font-medium uppercase tracking-widest text-noir-500">Total Revenue</p>
              <p className="mt-1 font-display text-2xl font-semibold text-noir-900">{formatPrice(s.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-noir-900/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-noir-900/10 p-3">
              <ShoppingBag className="h-6 w-6 text-noir-900" />
            </div>
            <div>
              <p className="text-label font-medium uppercase tracking-widest text-noir-500">Total Orders</p>
              <p className="mt-1 font-display text-2xl font-semibold text-noir-900">{s.totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-noir-900/10 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-champagne-300/50 p-3">
              <TrendingUp className="h-6 w-6 text-noir-700" />
            </div>
            <div>
              <p className="text-label font-medium uppercase tracking-widest text-noir-500">Top selling</p>
              <p className="mt-1 text-sm text-noir-600">{s.topProducts.length} products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-noir-900/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-noir-900">Top Selling Products</h2>
        {s.topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-noir-500">No sales data yet. Orders will appear here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-noir-900/5">
            {s.topProducts.map((item, i) => (
              <li key={item.productId} className="flex items-center justify-between py-3 first:pt-0">
                <span className="text-noir-500 tabular-nums">#{i + 1}</span>
                <span className="min-w-0 flex-1 truncate px-4 font-medium text-noir-900">{item.name}</span>
                <span className="text-label font-medium text-noir-600">{item.quantitySold} sold</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
