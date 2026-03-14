"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import AdminNav from "@/components/AdminNav";
import { RefreshCw, CheckCircle, XCircle, Loader2, Link2, Trash2 } from "lucide-react";

type Status = {
  ok: boolean;
  configured: boolean;
  oauthReady?: boolean;
  hasUserToken?: boolean;
  readyToSync?: boolean;
  environment: string;
  message: string;
};

type SyncResult = {
  ok: boolean;
  inserted?: number;
  updated?: number;
  sold?: number;
  removed?: number;
  errors?: string[];
  message?: string;
  rollback?: boolean;
  deleted?: number;
  /** Relatório de atualização só descrição / só preço */
  skipped?: number;
  notFound?: number;
};

export default function AdminEbaySyncPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [rollbacking, setRollbacking] = useState(false);
  const [updatingDesc, setUpdatingDesc] = useState(false);
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [removingUnavailable, setRemovingUnavailable] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const [flash, setFlash] = useState<"success" | "error" | "config" | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "1") {
      setFlash("success");
      fetchStatus();
      router.replace(`/${locale}/admin/ebay-sync`);
    } else if (err === "oauth") {
      setFlash("error");
      router.replace(`/${locale}/admin/ebay-sync`);
    } else if (err === "config") {
      setFlash("config");
      router.replace(`/${locale}/admin/ebay-sync`);
    }
  }, [searchParams, router, locale]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(t);
  }, [flash]);

  const fetchStatus = () => {
    setLoading(true);
    setResult(null);
    fetch("/api/sync-ebay", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/admin`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => setStatus({ ok: false, configured: false, environment: "unknown", message: "Could not check connection." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, [router, locale]);

  const runSync = () => {
    setSyncing(true);
    setResult(null);
    fetch("/api/sync-ebay", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ ok: false, errors: ["Sync request failed."] }))
      .finally(() => setSyncing(false));
  };

  const runRollback = () => {
    if (!confirm("Remove all products that came from eBay from your store? This cannot be undone.")) return;
    setRollbacking(true);
    setResult(null);
    fetch("/api/sync-ebay?rollback=1", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ ok: false, errors: ["Rollback request failed."] }))
      .finally(() => setRollbacking(false));
  };

  const runUpdateDescriptions = () => {
    setUpdatingDesc(true);
    setResult(null);
    fetch("/api/sync-ebay?update=description", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ ok: false, errors: ["Update descriptions failed."] }))
      .finally(() => setUpdatingDesc(false));
  };

  const runUpdatePrices = () => {
    setUpdatingPrice(true);
    setResult(null);
    fetch("/api/sync-ebay?update=price", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ ok: false, errors: ["Update prices failed."] }))
      .finally(() => setUpdatingPrice(false));
  };

  const runRemoveUnavailable = () => {
    if (!confirm("Remove from the store all eBay products that are no longer active (sold or ended)? This cannot be undone.")) return;
    setRemovingUnavailable(true);
    setResult(null);
    fetch("/api/sync-ebay?removeUnavailable=1", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ ok: false, errors: ["Sync sales failed."] }))
      .finally(() => setRemovingUnavailable(false));
  };

  if (loading || !status) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-noir-400" />
        <p className="mt-4 text-noir-600">Checking eBay connection…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">eBay Sync</h1>
        <AdminNav />
      </div>

      {flash === "success" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          eBay account connected successfully. You can sync now.
        </div>
      )}
      {flash === "error" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Could not connect to eBay. Please try again.
        </div>
      )}
      {flash === "config" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Add EBAY_REDIRECT_URI in Vercel (e.g. https://savjewelry.shop/api/ebay-oauth/callback).
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-noir-900/10 bg-section p-6">
        <h2 className="font-display text-lg font-medium text-noir-900">Connection status</h2>
        <div className="flex items-center gap-4 rounded-2xl border border-noir-900/5 bg-white p-4">
          {status.readyToSync ? (
            <>
              <CheckCircle className="h-10 w-10 shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-noir-900">eBay connected</p>
                <p className="text-sm text-noir-600">
                  Environment: <span className="font-mono">{status.environment}</span>
                </p>
                <p className="mt-1 text-sm text-noir-500">{status.message}</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-10 w-10 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-noir-900">
                  {status.configured && status.oauthReady && !status.hasUserToken
                    ? "eBay not connected"
                    : "eBay not configured"}
                </p>
                <p className="text-sm text-noir-600">{status.message}</p>
              </div>
            </>
          )}
        </div>

        {status.configured && status.oauthReady && !status.hasUserToken && (
          <a
            href={`/api/ebay-oauth/authorize?state=${locale}`}
            className="inline-flex items-center gap-2 rounded-full bg-noir-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-noir-800"
          >
            <Link2 className="h-4 w-4" />
            Connect eBay account
          </a>
        )}

        <button
          type="button"
          onClick={fetchStatus}
          className="text-sm font-medium text-noir-500 underline hover:text-noir-900"
        >
          Refresh status
        </button>

        <hr className="border-noir-900/10" />

        <h2 className="font-display text-lg font-medium text-noir-900">Sync products</h2>
        <p className="text-sm text-noir-600">
          Fetches active inventory from eBay and syncs to your store. New products are added, existing ones updated,
          sold-out items marked.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runSync}
            disabled={!status.readyToSync || syncing}
            className="inline-flex items-center gap-2 rounded-full bg-noir-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-noir-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync now
              </>
            )}
          </button>
          <button
            type="button"
            onClick={runRollback}
            disabled={rollbacking}
            className="inline-flex items-center gap-2 rounded-full border border-amber-600 bg-white px-6 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
          >
            {rollbacking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Remove eBay products
          </button>
        </div>

        <hr className="border-noir-900/10" />

        <h2 className="font-display text-lg font-medium text-noir-900">Sync sales (remove sold / unavailable)</h2>
        <p className="text-sm text-noir-600">
          Compares your store with active eBay listings. Removes products that are no longer for sale on eBay (sold or ended).
        </p>
        <button
          type="button"
          onClick={runRemoveUnavailable}
          disabled={!status.readyToSync || removingUnavailable}
          className="inline-flex items-center gap-2 rounded-full border border-noir-900/30 bg-white px-6 py-3 text-sm font-medium text-noir-700 transition hover:bg-noir-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removingUnavailable ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Sync sales (remove unavailable)
        </button>

        <hr className="border-noir-900/10" />

        <h2 className="font-display text-lg font-medium text-noir-900">Update existing products only</h2>
        <p className="text-sm text-noir-600">
          Only updates products already in your store (from eBay). Does not add new products.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runUpdateDescriptions}
            disabled={!status.readyToSync || updatingDesc}
            className="inline-flex items-center gap-2 rounded-full border border-noir-900/30 bg-white px-6 py-3 text-sm font-medium text-noir-700 transition hover:bg-noir-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update descriptions
          </button>
          <button
            type="button"
            onClick={runUpdatePrices}
            disabled={!status.readyToSync || updatingPrice}
            className="inline-flex items-center gap-2 rounded-full border border-noir-900/30 bg-white px-6 py-3 text-sm font-medium text-noir-700 transition hover:bg-noir-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update prices
          </button>
        </div>

        {result && (
          <div
            className={`rounded-2xl border p-4 ${
              result.ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="font-medium text-noir-900">
              {result.rollback ? "Rollback completed" : result.removed !== undefined ? "Sync sales completed" : result.skipped !== undefined ? "Update report" : result.ok ? "Sync completed" : "Sync completed with errors"}
            </p>
            {result.ok && result.rollback && (
              <p className="mt-2 text-sm text-noir-600">Removed {result.deleted ?? 0} eBay product(s) from the store.</p>
            )}
            {result.ok && result.removed !== undefined && (
              <p className="mt-2 text-sm text-noir-600">Removed {result.removed} product(s) no longer available on eBay.</p>
            )}
            {result.ok && result.skipped !== undefined && (
              <p className="mt-2 text-sm text-noir-600">
                Updated: {result.updated ?? 0} · Skipped (no change): {result.skipped ?? 0} · Not found on eBay: {result.notFound ?? 0}
              </p>
            )}
            {result.ok && !result.rollback && result.skipped === undefined && (
              <>
                <p className="mt-2 text-sm text-noir-600">
                  Inserted: {result.inserted ?? 0} · Updated: {result.updated ?? 0} · Marked sold: {result.sold ?? 0}
                </p>
                {result.message && (
                  <p className="mt-2 text-sm text-noir-500">{result.message}</p>
                )}
              </>
            )}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-amber-800">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
