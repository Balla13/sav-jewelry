import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getSettings } from "@/lib/supabase/settings";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import UrgencyBanner from "@/components/UrgencyBanner";
import Footer from "@/components/Footer";
import MetaPixel from "@/components/MetaPixel";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "es")) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const settings = await getSettings();
  const pixelId = (settings.meta_pixel_id || "").trim() || null;

  return (
    <NextIntlClientProvider messages={messages}>
      <UrgencyBanner />
      <Navbar />
      <MetaPixel pixelId={pixelId} />
      <main className="flex min-h-screen flex-col">{children}</main>
      <Footer />
      <CartDrawer />
    </NextIntlClientProvider>
  );
}
