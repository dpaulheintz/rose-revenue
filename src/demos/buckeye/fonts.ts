import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

// Condensed headings like a shop drawing's title block, a plain workhorse for the UI, mono for part and lot numbers. Not preloaded (other demos never use them).
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600"], variable: "--font-buck-display", display: "swap", preload: false });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-buck-body", display: "swap", preload: false });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-buck-mono", display: "swap", preload: false });

export const fontClass = `${display.variable} ${body.variable} ${mono.variable}`;
/** Point the kit's font roles at this demo's fonts. */
export const fontVars = { "--font-demo-display": "var(--font-buck-display)", "--font-demo-body": "var(--font-buck-body)", "--font-demo-mono": "var(--font-buck-mono)" };
