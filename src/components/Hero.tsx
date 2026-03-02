"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Hero() {
  const t = useTranslations("hero");
  const [bannerDesktop, setBannerDesktop] = useState<string | null>(null);
  const [bannerMobile, setBannerMobile] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setBannerDesktop(data?.home_hero_banner_desktop_url || null);
        setBannerMobile(data?.home_hero_banner_mobile_url || null);
      })
      .catch(() => {});
  }, []);

  const mobileSrc = bannerMobile || "/banner-mobile.png";
  const desktopSrc = bannerDesktop || "/banner-desktop.png";

  return (
    <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-white">
      {/* Banner mobile: até lg */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src={mobileSrc}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          unoptimized={!!bannerMobile}
        />
      </div>
      {/* Banner desktop: lg em diante */}
      <div className="absolute inset-0 hidden lg:block">
        <Image
          src={desktopSrc}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          unoptimized={!!bannerDesktop}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent" aria-hidden />
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-20">
        <p className="text-label font-medium uppercase tracking-widest text-gold">
          {t("tagline")}
        </p>
        <h1 className="mt-6 max-w-2xl font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl lg:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-8 max-w-lg text-base leading-relaxed text-noir-700">
          {t("subtitle")}
        </p>
        <div className="mt-10">
          <Link
            href="/collection"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-noir-900 bg-noir-900 px-8 py-3.5 text-label font-medium uppercase tracking-widest text-white transition hover:bg-noir-800 hover:shadow-lg"
          >
            {t("cta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
