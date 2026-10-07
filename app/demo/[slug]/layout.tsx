import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Aleo, IBM_Plex_Mono, Open_Sans } from "next/font/google";
import { demoSlugs, getDemo } from "@/demos/registry";
import { todayIn } from "@/lib/demo/dates";
import DemoProvider from "@/components/demo/DemoProvider";
import DemoShell from "@/components/demo/DemoShell";
import FarmProvider from "@/components/demo/farm/FarmProvider";
import "./demo.css";

// Headings: Aleo, the slab serif on the farm's own site. Body: Open Sans, from its store.
// Mono: ear tags and lot codes.
const display = Aleo({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-demo-display", display: "swap" });
const body = Open_Sans({ subsets: ["latin"], variable: "--font-demo-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-demo-mono", display: "swap" });

// Regenerate hourly so "today" (and every date in the demo) stays current.
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => demoSlugs.map((slug) => ({ slug }));

export async function generateMetadata({ params }: LayoutProps<"/demo/[slug]">): Promise<Metadata> {
  const cfg = getDemo((await params).slug);
  if (!cfg) return {};
  const title = `${cfg.company.appName} · ${cfg.company.name}`;
  const description = `Concept demo prepared for ${cfg.company.name} by Rose Revenue. Sample data: all names, numbers and records are fictional.`;
  const image = { url: `/demo/${cfg.slug}/og.jpg`, width: 1200, height: 630, type: "image/jpeg", alt: `${cfg.company.name} ${cfg.company.appName}, concept demo by Rose Revenue` };
  return {
    title: { default: title, template: `%s · ${title}` },
    description,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: `/demo/${cfg.slug}` },
    openGraph: { type: "website", url: `/demo/${cfg.slug}`, siteName: "Rose Revenue", title: `${title} (concept demo)`, description, images: [image] },
    twitter: { card: "summary_large_image", title: `${title} (concept demo)`, description, images: [image] },
  };
}

export const viewport: Viewport = { themeColor: "#263421" };

export default async function DemoLayout({ children, params }: LayoutProps<"/demo/[slug]">) {
  const { slug } = await params;
  const cfg = getDemo(slug);
  if (!cfg) notFound();
  const anchor = todayIn(cfg.timeZone);
  const t = cfg.theme;
  const vars = {
    "--d-bg": t.bg, "--d-panel": t.panel, "--d-panel2": t.panel2, "--d-line": t.line, "--d-text": t.text, "--d-muted": t.muted,
    "--d-accent": t.accent, "--d-on-accent": t.onAccent, "--d-header": t.header, "--d-on-header": t.onHeader,
    "--d-good": t.good, "--d-bad": t.bad, "--d-warn": t.warn, "--d-info": t.info,
    ...Object.fromEntries(t.chart.map((c, i) => [`--d-c${i + 1}`, c])),
  } as CSSProperties;

  return (
    <div className={`demo-root ${display.variable} ${body.variable} ${mono.variable}`} style={vars}>
      <DemoProvider slug={slug} anchor={anchor}>
        <FarmProvider slug={slug} anchor={anchor}>
          <DemoShell>{children}</DemoShell>
        </FarmProvider>
      </DemoProvider>
    </div>
  );
}
