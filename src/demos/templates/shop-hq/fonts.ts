import { Bricolage_Grotesque, Figtree } from "next/font/google";

// Sturdy, friendly and readable in a truck: Bricolage Grotesque for headings and numbers, Figtree for text. Not preloaded (other demos never use them).
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-shq-display", display: "swap", preload: false });
const body = Figtree({ subsets: ["latin"], variable: "--font-shq-body", display: "swap", preload: false });

export const fontClass = `${display.variable} ${body.variable}`;
/** Point the kit's font roles at this template's fonts. */
export const fontVars = { "--font-demo-display": "var(--font-shq-display)", "--font-demo-body": "var(--font-shq-body)", "--font-demo-mono": "var(--font-shq-body)" };
