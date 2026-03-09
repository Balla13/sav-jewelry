"use client";

import Image from "next/image";

const GOOGLE_REVIEW_URL = "https://share.google/5hvlkQThZHbBKKCY6";

export default function GoogleReviewStrip() {
  return (
    <section className="border-t border-noir-900/5 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-8 sm:px-8 lg:px-12">
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full max-w-xl items-center gap-4 rounded-2xl border border-noir-900/10 bg-section px-4 py-3 shadow-sm transition hover:border-noir-900/30 hover:bg-white hover:shadow-md"
        >
          <div className="relative h-12 w-20 overflow-hidden rounded-xl bg-noir-900/5 sm:h-14 sm:w-24">
            <Image
              src="/banner-desktop.png"
              alt="SÁV Jewelry storefront"
              fill
              className="object-cover object-center"
              sizes="96px"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-noir-500">
              Google Reviews
            </p>
            <p className="mt-1 text-sm font-semibold text-noir-900">
              5.0 ★★★★★
            </p>
            <p className="mt-0.5 text-xs text-noir-600">
              Veja o perfil da SÁV Jewelry no Google e as avaliações de clientes reais.
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}

