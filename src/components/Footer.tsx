"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState, useEffect } from "react";

type Settings = {
  instagram_url: string | null;
  facebook_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations("footer");
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() =>
        setSettings({ instagram_url: null, facebook_url: null, contact_email: null, contact_phone: null })
      );
  }, []);

  const hasContact =
    settings && (settings.contact_email || settings.contact_phone || settings.instagram_url || settings.facebook_url);

  return (
    <footer className="border-t border-noir-900/5 bg-section">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          <div>
            <h3 className="text-label font-medium uppercase tracking-widest text-noir-900">
              {t("shop")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/collection" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("allJewelry")}
                </Link>
              </li>
              <li>
                <Link href="/collection?category=Rings" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("rings")}
                </Link>
              </li>
              <li>
                <Link href="/collection?category=Necklaces" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("necklaces")}
                </Link>
              </li>
              <li>
                <Link href="/collection?category=Earrings" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("earrings")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-label font-medium uppercase tracking-widest text-noir-900">
              {t("company")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-label font-medium uppercase tracking-widest text-noir-900">
              {t("legal")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/privacy" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("shippingPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-noir-500 hover:text-noir-900">
                  {t("refundPolicy")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            {hasContact && settings && (
              <>
                <h3 className="text-label font-medium uppercase tracking-widest text-noir-900">
                  {t("contact")}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {settings.contact_email && (
                    <li>
                      <a
                        href={`mailto:${settings.contact_email}`}
                        className="text-sm text-noir-500 hover:text-noir-900"
                      >
                        {settings.contact_email}
                      </a>
                    </li>
                  )}
                  {settings.contact_phone && (
                    <li>
                      <a
                        href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                        className="text-sm text-noir-500 hover:text-noir-900"
                      >
                        {settings.contact_phone}
                      </a>
                    </li>
                  )}
                </ul>
                <div className="mt-4 flex gap-3">
                  {settings.instagram_url && (
                    <a
                      href={settings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-noir-900/15 text-noir-600 transition hover:border-noir-900/30 hover:bg-noir-900/5 hover:text-noir-900"
                      aria-label="Instagram"
                    >
                      <InstagramIcon className="h-5 w-5" />
                    </a>
                  )}
                  {settings.facebook_url && (
                    <a
                      href={settings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-noir-900/15 text-noir-600 transition hover:border-noir-900/30 hover:bg-noir-900/5 hover:text-noir-900"
                      aria-label="Facebook"
                    >
                      <FacebookIcon className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </>
            )}
            <p className={`font-display text-sm font-light italic text-noir-700 ${hasContact ? "mt-4" : ""}`}>
              {t("tagline")}
            </p>
            <p className="mt-3 text-label text-noir-500">
              {t("tagline")}
            </p>
            <p className="mt-3 text-label text-noir-500">
              © {new Date().getFullYear()} {t("brandName")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
