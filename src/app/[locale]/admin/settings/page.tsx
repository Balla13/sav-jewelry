"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default function AdminSettingsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [shippingFeeUsd, setShippingFeeUsd] = useState("5");
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null);
  const [siteIconUrl, setSiteIconUrl] = useState<string | null>(null);
  const [heroDesktopUrl, setHeroDesktopUrl] = useState<string | null>(null);
  const [heroMobileUrl, setHeroMobileUrl] = useState<string | null>(null);
  const [metaPixelId, setMetaPixelId] = useState("");
  const [uniquePieceLabel, setUniquePieceLabel] = useState("");
  const [shippingInsuredText, setShippingInsuredText] = useState("");
  const [coupons, setCoupons] = useState<{ id: string; code: string; type: string; value: number }[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "fixed">("percent");
  const [couponValue, setCouponValue] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const heroDesktopInputRef = useRef<HTMLInputElement>(null);
  const heroMobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/admin`);
          return {
            instagram_url: null,
            facebook_url: null,
            contact_email: null,
            contact_phone: null,
            shipping_fee_usd: 5,
            site_logo_url: null,
            site_icon_url: null,
            home_hero_banner_desktop_url: null,
            home_hero_banner_mobile_url: null,
            meta_pixel_id: null,
          };
        }
        return res.json();
      })
      .then((data) => {
        setInstagram(data?.instagram_url || "");
        setFacebook(data?.facebook_url || "");
        setContactEmail(data?.contact_email || "");
        setContactPhone(data?.contact_phone || "");
        setShippingFeeUsd(data?.shipping_fee_usd != null ? String(data.shipping_fee_usd) : "5");
        setSiteLogoUrl(data?.site_logo_url || null);
        setSiteIconUrl(data?.site_icon_url || null);
        setHeroDesktopUrl(data?.home_hero_banner_desktop_url || null);
        setHeroMobileUrl(data?.home_hero_banner_mobile_url || null);
        setMetaPixelId(data?.meta_pixel_id || "");
        setUniquePieceLabel(data?.unique_piece_label || "");
        setShippingInsuredText(data?.shipping_insured_text || "");
      })
      .catch(() => {});
  }, [router, locale]);

  useEffect(() => {
    fetch("/api/admin/coupons", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => setCoupons([]));
  }, []);

  const addCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    const value = parseFloat(couponValue) || 0;
    if (!code) return;
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, type: couponType, value }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) {
      setCoupons((prev) => [...prev, { id: data.id, code: data.code, type: data.type, value: data.value }]);
      setCouponCode("");
      setCouponValue("");
    } else {
      setError(data.error || "Failed to add coupon");
    }
  };

  const deleteCoupon = async (id: string) => {
    const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  const handleBrandingUpload = async (
    type: "logo" | "icon" | "hero-desktop" | "hero-mobile",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", type);
    try {
      const res = await fetch("/api/admin/upload-branding", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        if (type === "logo") setSiteLogoUrl(data.url);
        else if (type === "icon") setSiteIconUrl(data.url);
        else if (type === "hero-desktop") setHeroDesktopUrl(data.url);
        else setHeroMobileUrl(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const fee = Math.max(0, parseFloat(shippingFeeUsd) || 0);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        instagram_url: instagram.trim() || null,
        facebook_url: facebook.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        shipping_fee_usd: fee,
        site_logo_url: siteLogoUrl,
        site_icon_url: siteIconUrl,
        home_hero_banner_desktop_url: heroDesktopUrl,
        home_hero_banner_mobile_url: heroMobileUrl,
        meta_pixel_id: metaPixelId.trim() || null,
        unique_piece_label: uniquePieceLabel.trim() || null,
        shipping_insured_text: shippingInsuredText.trim() || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setSuccess("Settings saved.");
    } else {
      setError(data.error || "Failed to save");
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">Settings</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/inventory"
            className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
          >
            Inventory
          </Link>
          <Link
            href="/admin/contacts"
            className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
          >
            Contacts
          </Link>
          <Link href="/admin" className="text-sm font-medium text-noir-600 hover:text-noir-900">
            Add product
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-noir-900/10 bg-section p-6">
        <h2 className="font-display text-lg font-medium text-noir-900">Social media links</h2>
        <p className="text-sm text-noir-600">
          These links and contact info appear in the site footer. Leave blank to hide.
        </p>
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-noir-700">
            Contact email
          </label>
          <input
            id="contact_email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contato@loja.com"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 placeholder:text-noir-400"
          />
        </div>
        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-noir-700">
            Contact phone
          </label>
          <input
            id="contact_phone"
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 placeholder:text-noir-400"
          />
        </div>
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-noir-700">
            Instagram URL
          </label>
          <input
            id="instagram"
            type="url"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/yourprofile"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 placeholder:text-noir-400"
          />
        </div>
        <div>
          <label htmlFor="facebook" className="block text-sm font-medium text-noir-700">
            Facebook URL
          </label>
          <input
            id="facebook"
            type="url"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/yourpage"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 placeholder:text-noir-400"
          />
        </div>
        <h2 className="font-display text-lg font-medium text-noir-900 pt-2">Etiqueta e envio</h2>
        <p className="text-sm text-noir-600">
          Texto da etiqueta &quot;Peça única&quot; (ex.: Peça única). Deixe vazio para não exibir. Texto sobre seguro no envio (ex.: Envio com seguro incluído).
        </p>
        <div>
          <label htmlFor="unique_piece_label" className="block text-sm font-medium text-noir-700">
            Etiqueta peça única
          </label>
          <input
            id="unique_piece_label"
            type="text"
            value={uniquePieceLabel}
            onChange={(e) => setUniquePieceLabel(e.target.value)}
            placeholder="Peça única"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 placeholder:text-noir-400"
          />
        </div>
        <div>
          <label htmlFor="shipping_insured_text" className="block text-sm font-medium text-noir-700">
            Texto seguro no envio
          </label>
          <input
            id="shipping_insured_text"
            type="text"
            value={shippingInsuredText}
            onChange={(e) => setShippingInsuredText(e.target.value)}
            placeholder="Envio com seguro incluído"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 placeholder:text-noir-400"
          />
        </div>
        <h2 className="font-display text-lg font-medium text-noir-900 pt-2">Shipping</h2>
        <p className="text-sm text-noir-600">
          Fixed shipping fee (USD) applied at checkout when the order has at least one product with paid shipping.
        </p>
        <div>
          <label htmlFor="shipping_fee" className="block text-sm font-medium text-noir-700">
            Fixed shipping (USD)
          </label>
          <input
            id="shipping_fee"
            type="number"
            min="0"
            step="0.01"
            value={shippingFeeUsd}
            onChange={(e) => setShippingFeeUsd(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900"
          />
        </div>

        <h2 className="font-display text-lg font-medium text-noir-900 pt-4">Branding</h2>
        <p className="text-sm text-noir-600">
          Site logo and home hero banner. Upload to Supabase; they update the header and home page.
        </p>
        <div>
          <label className="block text-sm font-medium text-noir-700">Site Logo</label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleBrandingUpload("logo", e)}
            disabled={!!uploading}
          />
          {siteLogoUrl && (
            <div className="mt-2 relative h-16 w-48 rounded-xl overflow-hidden bg-noir-100 border border-noir-900/10">
              <Image src={siteLogoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
            </div>
          )}
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={!!uploading}
            className="mt-2 rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-900/5 disabled:opacity-60"
          >
            {uploading === "logo" ? "Uploading..." : siteLogoUrl ? "Replace logo" : "Upload logo"}
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">Site Icon (favicon)</label>
          <p className="mt-1 text-xs text-noir-500">
            Recomendado: 16×16 ou 32×32 (PNG). O site vai usar isso em <code>/favicon.ico</code>.
          </p>
          <input
            ref={iconInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleBrandingUpload("icon", e)}
            disabled={!!uploading}
          />
          {siteIconUrl && (
            <div className="mt-2 inline-flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-noir-100 border border-noir-900/10">
                <Image src={siteIconUrl} alt="Icon" fill className="object-contain" unoptimized />
              </div>
              <p className="text-xs text-noir-500 break-all">{siteIconUrl}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => iconInputRef.current?.click()}
            disabled={!!uploading}
            className="mt-2 rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-900/5 disabled:opacity-60"
          >
            {uploading === "icon" ? "Uploading..." : siteIconUrl ? "Replace icon" : "Upload icon"}
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">Home Hero Banner (desktop)</label>
          <input
            ref={heroDesktopInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleBrandingUpload("hero-desktop", e)}
            disabled={!!uploading}
          />
          {heroDesktopUrl && (
            <div className="mt-2 relative h-24 w-full max-w-md rounded-xl overflow-hidden bg-noir-100 border border-noir-900/10">
              <Image src={heroDesktopUrl} alt="Hero desktop" fill className="object-cover" unoptimized />
            </div>
          )}
          <button
            type="button"
            onClick={() => heroDesktopInputRef.current?.click()}
            disabled={!!uploading}
            className="mt-2 rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-900/5 disabled:opacity-60"
          >
            {uploading === "hero-desktop" ? "Uploading..." : heroDesktopUrl ? "Replace desktop banner" : "Upload desktop banner"}
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-noir-700">Home Hero Banner (mobile)</label>
          <input
            ref={heroMobileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleBrandingUpload("hero-mobile", e)}
            disabled={!!uploading}
          />
          {heroMobileUrl && (
            <div className="mt-2 relative h-24 w-40 rounded-xl overflow-hidden bg-noir-100 border border-noir-900/10">
              <Image src={heroMobileUrl} alt="Hero mobile" fill className="object-cover" unoptimized />
            </div>
          )}
          <button
            type="button"
            onClick={() => heroMobileInputRef.current?.click()}
            disabled={!!uploading}
            className="mt-2 rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-900/5 disabled:opacity-60"
          >
            {uploading === "hero-mobile" ? "Uploading..." : heroMobileUrl ? "Replace mobile banner" : "Upload mobile banner"}
          </button>
        </div>

        <h2 className="font-display text-lg font-medium text-noir-900 pt-4">Tracking</h2>
        <p className="text-sm text-noir-600">
          Cole apenas o ID do Pixel (ex.: <code>1234567890</code>). O script será injetado automaticamente.
        </p>
        <div>
          <label htmlFor="meta_pixel_id" className="block text-sm font-medium text-noir-700">
            Meta/Facebook Pixel ID
          </label>
          <input
            id="meta_pixel_id"
            type="text"
            value={metaPixelId}
            onChange={(e) => setMetaPixelId(e.target.value)}
            placeholder="1234567890"
            className="mt-1 w-full rounded-2xl border border-champagne-300 px-4 py-2.5 text-noir-900 placeholder:text-noir-400"
          />
        </div>

        <h2 className="font-display text-lg font-medium text-noir-900 pt-4">Coupons</h2>
        <p className="text-sm text-noir-600">
          Create discount codes: percent (e.g. 10 for 10%) or fixed amount in USD (e.g. 5 for $5 off).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-noir-600">Code</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="mt-1 w-32 rounded-xl border border-champagne-300 px-3 py-2 text-noir-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-noir-600">Type</label>
            <select
              value={couponType}
              onChange={(e) => setCouponType(e.target.value as "percent" | "fixed")}
              className="mt-1 rounded-xl border border-champagne-300 px-3 py-2 text-noir-900"
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-noir-600">Value</label>
            <input
              type="number"
              min="0"
              step={couponType === "percent" ? "1" : "0.01"}
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
              placeholder={couponType === "percent" ? "10" : "5"}
              className="mt-1 w-24 rounded-xl border border-champagne-300 px-3 py-2 text-noir-900"
            />
          </div>
          <button
            type="button"
            onClick={addCoupon}
            className="rounded-full bg-noir-900 px-4 py-2 text-sm font-medium text-white hover:bg-noir-800"
          >
            Add coupon
          </button>
        </div>
        {coupons.length > 0 && (
          <ul className="mt-2 space-y-2">
            {coupons.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-noir-900/10 bg-white px-4 py-2">
                <span className="font-medium text-noir-900">{c.code}</span>
                <span className="text-sm text-noir-600">
                  {c.type === "percent" ? `${c.value}%` : `$${c.value}`}
                </span>
                <button
                  type="button"
                  onClick={() => deleteCoupon(c.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-noir-900 py-3 text-sm font-medium text-white transition hover:bg-noir-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}
