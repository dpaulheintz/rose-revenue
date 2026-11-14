import { Manrope, Source_Sans_3 } from "next/font/google";

// Built for reading numbers at a desk: Manrope for headings, Source Sans 3 for text and tables. Not preloaded (other demos never use them).
const display = Manrope({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-phq-display", display: "swap", preload: false });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-phq-body", display: "swap", preload: false });

export const fontClass = `${display.variable} ${body.variable}`;
/** Point the kit's font roles at this template's fonts. */
export const fontVars = { "--font-demo-display": "var(--font-phq-display)", "--font-demo-body": "var(--font-phq-body)", "--font-demo-mono": "var(--font-phq-body)" };
