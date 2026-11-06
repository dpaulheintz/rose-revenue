import { Montserrat, Mulish } from "next/font/google";

// The site's own pairing: Montserrat for headings, Mulish for text. Not preloaded (other demos never use them).
const display = Montserrat({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-at-display", display: "swap", preload: false });
const body = Mulish({ subsets: ["latin"], variable: "--font-at-body", display: "swap", preload: false });

export const fontClass = `${display.variable} ${body.variable}`;
/** Point the kit's font roles at this demo's fonts. */
export const fontVars = { "--font-demo-display": "var(--font-at-display)", "--font-demo-body": "var(--font-at-body)", "--font-demo-mono": "var(--font-at-body)" };
