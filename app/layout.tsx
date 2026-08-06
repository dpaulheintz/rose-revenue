import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-geist",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const title = "Rose Revenue — We build the tools your business wishes existed";
const description =
  "Rose Revenue helps small businesses use AI to do more with what they already have. No enterprise software. No consultants in suits. Just tools built for how you actually work.";

export const metadata: Metadata = {
  metadataBase: new URL("https://roserevenue.com"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Rose Revenue",
    images: [
      {
        url: "/og.webp",
        width: 1200,
        height: 632,
        alt: "Rose Revenue — a coral path winding through green hills at dusk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${instrumentSerif.variable}`}
    >
      <body>
        {children}
        {/* Grain: fixed, tiling, non-interactive noise across the whole page. */}
        <div className="grain-overlay" aria-hidden="true" />
        <Analytics />
      </body>
    </html>
  );
}
