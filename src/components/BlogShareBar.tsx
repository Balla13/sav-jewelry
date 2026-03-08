"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

const SITE = "https://savjewelry.shop";

type Props = {
  title: string;
  description: string;
  /** Optional: floating bar at bottom of viewport. Default: inline at end of content. */
  floating?: boolean;
};

function encodeUri(s: string): string {
  return encodeURIComponent(s);
}

export default function BlogShareBar({ title, description, floating }: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const fullUrl = `${SITE}/${locale}${pathname}`;
  const text = `${title} — ${description}`.slice(0, 200);

  const copyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
    }
  };

  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeUri(text + " " + fullUrl)}`, aria: "Share on WhatsApp" },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeUri(fullUrl)}`, aria: "Share on Facebook" },
    { name: "Pinterest", href: `https://pinterest.com/pin/create/button/?url=${encodeUri(fullUrl)}&description=${encodeUri(title)}`, aria: "Share on Pinterest" },
    { name: "X (Twitter)", href: `https://twitter.com/intent/tweet?url=${encodeUri(fullUrl)}&text=${encodeUri(title)}`, aria: "Share on X" },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeUri(fullUrl)}`, aria: "Share on LinkedIn" },
    { name: "Instagram", href: "#", aria: "Copy link for Instagram", isCopy: true },
    { name: "Email", href: `mailto:?subject=${encodeUri(title)}&body=${encodeUri(text + "\n\n" + fullUrl)}`, aria: "Share by email" },
  ];

  const wrapperClass = floating
    ? "fixed bottom-0 left-0 right-0 z-40 border-t border-noir-900/10 bg-white/95 backdrop-blur-sm py-3"
    : "border-t border-noir-900/10 pt-8 mt-12";

  return (
    <aside className={wrapperClass} aria-label="Share this article">
      <div className={`mx-auto max-w-3xl px-4 ${floating ? "flex flex-wrap items-center justify-center gap-4" : ""}`}>
        <span className="mb-2 block text-label uppercase tracking-widest text-noir-500 sm:mb-0 sm:mr-2">
          Share
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {links.map(({ name, href, aria, isCopy }) =>
            isCopy ? (
              <button
                key={name}
                type="button"
                aria-label={aria}
                onClick={copyLink}
                className="inline-flex items-center rounded border border-noir-900/15 bg-noir-900/[0.02] px-3 py-2 text-xs font-medium text-noir-700 transition hover:border-gold/30 hover:bg-gold/5 hover:text-noir-900"
              >
                {name}
              </button>
            ) : (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={aria}
                className="inline-flex items-center rounded border border-noir-900/15 bg-noir-900/[0.02] px-3 py-2 text-xs font-medium text-noir-700 transition hover:border-gold/30 hover:bg-gold/5 hover:text-noir-900"
              >
                {name}
              </a>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
