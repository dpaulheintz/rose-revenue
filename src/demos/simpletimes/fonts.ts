import { Bayon, Roboto_Slab } from "next/font/google";

// The shop's own pairing: Bayon for headings, Roboto Slab for text. Not preloaded (other demos never use them).
const display = Bayon({ subsets: ["latin"], weight: "400", variable: "--font-st-display", display: "swap", preload: false });
const body = Roboto_Slab({ subsets: ["latin"], variable: "--font-st-body", display: "swap", preload: false });

export const fontClass = `${display.variable} ${body.variable}`;
/** Point the kit's font roles at this demo's fonts. */
export const fontVars = { "--font-demo-display": "var(--font-st-display)", "--font-demo-body": "var(--font-st-body)", "--font-demo-mono": "var(--font-st-body)" };
