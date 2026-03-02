"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/data/products";
import { PRODUCT_CATEGORIES } from "@/data/products";

const MAX_IMAGES = 5;

/** Recorta a imagem para 1:1 (quadrado) no centro antes do upload. */
async function cropImageToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("No blob"));
            return;
          }
          resolve(new File([blob], file.name, { type: file.type || "image/jpeg" }));
        },
        file.type || "image/jpeg",
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><p className="text-noir-600">Loading...</p></div>}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Rings",
    priceUsd: "",
    stockQuantity: "0",
    freeShipping: false,
    variations: "",
    imageUrls: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/login", { method: "POST", body: JSON.stringify({}), credentials: "include" }).catch(() => {});
    setAuthenticated(false);
  }, []);

  const fetchProducts = async () => {
    const res = await fetch("/api/admin/products", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    if (authenticated) fetchProducts();
  }, [authenticated]);

  const editId = searchParams.get("edit");
  useEffect(() => {
    if (!authenticated || !editId || products.length === 0) return;
    const p = products.find((x) => x.id === editId);
    if (p) {
      setEditingId(p.id);
      setForm({
        name: p.name,
        description: p.description,
        category: p.category,
        priceUsd: String(p.priceUsd),
        stockQuantity: String(p.stockQuantity ?? 0),
        freeShipping: p.freeShipping ?? false,
        variations: (p.variations || []).join(", "),
        imageUrls: (p.images || [p.image]).join("\n"),
      });
    }
  }, [authenticated, editId, products]);

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

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setImageFiles([]);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      priceUsd: String(p.priceUsd),
      stockQuantity: String(p.stockQuantity ?? 0),
      freeShipping: p.freeShipping ?? false,
      variations: (p.variations || []).join(", "),
      imageUrls: (p.images || [p.image]).join("\n"),
    });
    setSuccess("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm({ name: "", description: "", category: "Rings", priceUsd: "", stockQuantity: "0", freeShipping: false, variations: "", imageUrls: "" });
      }
      setSuccess(t("productDeleted"));
    } else setError(t("deleteFailed"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    const variations = form.variations.split(",").map((v) => v.trim()).filter(Boolean);
    let images: string[];
    if (imageFiles.length > 0) {
      const fd = new FormData();
      try {
        const cropped: File[] = [];
        for (const f of imageFiles) {
          const file = await cropImageToSquare(f);
          cropped.push(file);
        }
        cropped.forEach((f) => fd.append("images", f));
      } catch (err) {
        setSubmitting(false);
        setError("Failed to process images. Use square (1:1) images.");
        return;
      }
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setSubmitting(false);
        setError(uploadData.error || "Upload failed");
        return;
      }
      images = uploadData.urls || [];
    } else {
      images = form.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    }
    if (!images.length) {
      setSubmitting(false);
      setError("At least one image is required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category as Product["category"],
      image: images[0],
      images,
      variations,
      price_usd: Number(form.priceUsd) || 0,
      stock_quantity: Math.max(0, parseInt(form.stockQuantity, 10) || 0),
      free_shipping: form.freeShipping,
    };
    if (editingId) {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingId, ...payload }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) {
        setSuccess(t("productUpdated"));
        setEditingId(null);
        setForm({ name: "", description: "", category: "Rings", priceUsd: "", stockQuantity: "0", freeShipping: false, variations: "", imageUrls: "" });
        setImageFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.replace(`/${locale}/admin`);
        fetchProducts();
      } else setError(data.error || "Failed to update product");
    } else {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) {
        setSuccess(t("productAdded"));
        setForm({ name: "", description: "", category: "Rings", priceUsd: "", stockQuantity: "0", freeShipping: false, variations: "", imageUrls: "" });
        setImageFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchProducts();
      } else setError(data.error || "Failed to add product");
    }
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">{editingId ? t("editProduct") : t("addProduct")}</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
          >
            Settings
          </Link>
          <Link
            href="/collection"
            className="text-sm font-medium text-noir-600 hover:text-noir-900"
          >
            {t("backToStore")}
          </Link>
        </div>
      </div>

      {products.length > 0 && !editingId && (
        <div className="mb-8 rounded-2xl border border-noir-900/10 bg-section p-4">
          <h2 className="mb-4 font-display text-lg font-medium text-noir-900">{t("inventory")}</h2>
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-noir-900/5 bg-white px-4 py-3">
                <span className="font-medium text-noir-900">{p.name}</span>
                <span className="text-sm text-noir-600">{p.category} · ${p.priceUsd}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    className="rounded-full bg-noir-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-noir-800"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    {t("delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-noir-700">{t("name")}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">{t("description")}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">{t("category")}</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Product["category"] }))}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">USD Price *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.priceUsd}
            onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">{t("stock") ?? "Stock"}</label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.stockQuantity}
            onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="free-shipping"
            type="checkbox"
            checked={form.freeShipping}
            onChange={(e) => setForm((f) => ({ ...f, freeShipping: e.target.checked }))}
            className="h-4 w-4 rounded border-champagne-300 text-noir-900 focus:ring-noir-900"
          />
          <label htmlFor="free-shipping" className="text-sm font-medium text-noir-700">
            {t("freeShipping") ?? "Free shipping for this product"}
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">{t("variations")} *</label>
          <input
            type="text"
            placeholder="Gold, Silver, Rose Gold"
            value={form.variations}
            onChange={(e) => setForm((f) => ({ ...f, variations: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">{t("uploadImages")} *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const list = Array.from(e.target.files || []).slice(0, MAX_IMAGES);
              setImageFiles(list);
            }}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 file:mr-3 file:rounded-full file:border-0 file:bg-noir-900 file:px-4 file:py-2 file:text-sm file:text-white"
          />
          <p className="mt-1 text-xs text-noir-500">
            {editingId ? "Upload new images to replace, or use URLs below." : "Required for new product. Max 5."}
            {" "}Imagens são recortadas automaticamente para 1:1 (quadrado) na grade.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">{t("imageUrls")}</label>
          <textarea
            placeholder="Or paste URLs (one per line). Used when not uploading files."
            value={form.imageUrls}
            onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
            rows={2}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 font-mono text-sm text-noir-900"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <div className="flex gap-3">
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ name: "", description: "", category: "Rings", priceUsd: "", stockQuantity: "0", freeShipping: false, variations: "", imageUrls: "" });
                setImageFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-full border border-noir-900/20 px-4 py-3 text-sm font-medium text-noir-700 hover:bg-noir-900/5"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-full bg-noir-900 py-3 text-sm font-medium text-white transition hover:bg-noir-800 hover:shadow-lg disabled:opacity-60"
          >
            {submitting ? t("saving") : t("saveProduct")}
          </button>
        </div>
      </form>
    </div>
  );
}
