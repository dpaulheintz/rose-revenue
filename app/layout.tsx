import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import SiteOnly from "@/components/SiteOnly";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist",
  display: "swap",
});

// Only used inside depicted software (The Pile, the mock app), so not preloaded.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const siteUrl = "https://rose-revenue.com";
const title = "Rose Revenue — We build the tools your business wishes existed";
const description =
  "Stop paying for a pile of software built for somebody else. Paul Heintzman builds Midwest small businesses their own CRM, revenue dashboard and team tools, connected and yours to own. Book a free 15-minute call.";
const shareTitle = "Custom tools for Midwest small businesses — Rose Revenue";
const shareDescription =
  "Your customers, your numbers, your projects. One place, built around how you run, and you own it.";
const shareImage = {
  url: "/og.webp",
  width: 1200,
  height: 632,
  alt: "Rose Revenue — a coral path winding through green hills at dusk",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Rose Revenue",
    title: shareTitle,
    description: shareDescription,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#020d02",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <SiteOnly>
          {/* Grain: fixed, tiling, non-interactive noise across the whole page. */}
          <div className="grain-overlay" aria-hidden="true" />
          <Analytics />
        </SiteOnly>
      </body>
    </html>
  );
}
