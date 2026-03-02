"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Menu, X, ShoppingBag, Mail, Phone } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useState, useEffect } from "react";

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

const locales = [
  { code: "en" as const, label: "EN" },
  { code: "es" as const, label: "ES" },
] as const;

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [social, setSocial] = useState<{
    instagram_url: string | null;
    facebook_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null>(null);
  const totalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setLogoUrl(data?.site_logo_url || null);
        setSocial({
          instagram_url: data?.instagram_url ?? null,
          facebook_url: data?.facebook_url ?? null,
          contact_email: data?.contact_email ?? null,
          contact_phone: data?.contact_phone ?? null,
        });
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/collection", label: t("collection") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
    { href: "/account", label: t("account") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-noir-900/5 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-display text-xl font-medium tracking-tight text-noir-900 sm:text-2xl"
        >
          {logoUrl ? (
            <div className="relative h-10 w-40 shrink-0 sm:h-12 sm:w-48">
              <Image
                src={logoUrl}
                alt={t("brandName")}
                fill
                className="object-contain object-left"
                priority
                unoptimized
              />
            </div>
          ) : (
            <Image
              src="/logo.png"
              alt={t("brandName")}
              width={160}
              height={48}
              className="h-10 w-auto shrink-0 sm:h-12"
              priority
            />
          )}
          <span className="hidden sm:inline">{t("brandName")}</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm font-medium text-noir-700 transition hover:text-noir-900"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-4">
          {social && (social.instagram_url || social.facebook_url || social.contact_email || social.contact_phone) && (
            <div className="hidden items-center gap-1 md:flex">
              {social.instagram_url && (
                <a
                  href={social.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 text-noir-600 transition hover:bg-noir-900/5 hover:text-noir-900"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              )}
              {social.facebook_url && (
                <a
                  href={social.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 text-noir-600 transition hover:bg-noir-900/5 hover:text-noir-900"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>
              )}
              {social.contact_email && (
                <a
                  href={`mailto:${social.contact_email}`}
                  className="rounded-full p-2 text-noir-600 transition hover:bg-noir-900/5 hover:text-noir-900"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
              {social.contact_phone && (
                <a
                  href={`tel:${social.contact_phone}`}
                  className="rounded-full p-2 text-noir-600 transition hover:bg-noir-900/5 hover:text-noir-900"
                  aria-label="Phone"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={toggleCart}
            className="relative rounded-full p-2.5 text-noir-700 transition hover:bg-noir-900/5 hover:shadow-lg"
            aria-label={t("cart")}
          >
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-noir-900 text-[10px] font-medium text-champagne-50">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1 rounded-full border border-champagne-300 bg-champagne-100/80 p-1">
            <span className="sr-only">{t("language")}</span>
            {locales.map(({ code, label }) => (
              <Link
                key={code}
                href={pathname}
                locale={code}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  locale === code
                    ? "bg-white text-noir-900 shadow-sm"
                    : "text-noir-600 hover:text-noir-900"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="md:hidden rounded-full p-2.5 text-noir-700 transition hover:bg-noir-900/5 hover:shadow-lg"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? t("closeMenu") : t("openMenu")}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-noir-900/5 bg-section px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-3">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block py-2 text-sm font-medium text-noir-700"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          {social && (social.instagram_url || social.facebook_url || social.contact_email || social.contact_phone) && (
            <div className="mt-4 flex items-center gap-2 border-t border-noir-900/10 pt-4">
              {social.instagram_url && (
                <a
                  href={social.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 text-noir-600 hover:bg-noir-900/5"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              )}
              {social.facebook_url && (
                <a
                  href={social.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 text-noir-600 hover:bg-noir-900/5"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>
              )}
              {social.contact_email && (
                <a href={`mailto:${social.contact_email}`} className="rounded-full p-2 text-noir-600 hover:bg-noir-900/5" aria-label="Email">
                  <Mail className="h-5 w-5" />
                </a>
              )}
              {social.contact_phone && (
                <a
                  href={`tel:${social.contact_phone}`}
                  className="rounded-full p-2 text-noir-600 hover:bg-noir-900/5"
                  aria-label="Phone"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
