import { Archivo_Black, Inter_Tight } from "next/font/google";

// A heavy grotesque for headings, a clean sans for the UI. Not preloaded (other demos never use them).
const display = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-shop-display", display: "swap", preload: false });
const body = Inter_Tight({ subsets: ["latin"], variable: "--font-shop-body", display: "swap", preload: false });

export const fontClass = `${display.variable} ${body.variable}`;
/** Point the kit's font roles at this demo's fonts. */
export const fontVars = { "--font-demo-display": "var(--font-shop-display)", "--font-demo-body": "var(--font-shop-body)", "--font-demo-mono": "var(--font-shop-body)" };
