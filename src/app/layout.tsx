import { Cormorant_Garamond, Playfair_Display, Inter } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getSettings } from "@/lib/supabase/settings";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

type Props = { children: ReactNode };

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    const iconUrl = (settings.site_icon_url || settings.site_logo_url)?.trim() || null;
    if (iconUrl) return { icons: { icon: iconUrl } };
  } catch {
    // ignore
  }
  return { icons: { icon: "/favicon.ico" } };
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen font-sans antialiased bg-white text-noir-800 ${cormorant.variable} ${playfair.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
