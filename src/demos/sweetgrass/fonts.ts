import { Aleo, IBM_Plex_Mono, Open_Sans } from "next/font/google";

// Headings: Aleo, the slab serif on the farm's own site. Body: Open Sans, from its store.
// Mono: ear tags and lot codes.
const display = Aleo({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-demo-display", display: "swap" });
const body = Open_Sans({ subsets: ["latin"], variable: "--font-demo-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-demo-mono", display: "swap" });

export const fontClass = `${display.variable} ${body.variable} ${mono.variable}`;
