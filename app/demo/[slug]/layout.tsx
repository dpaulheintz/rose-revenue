import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Roboto_Condensed, Saira_Condensed } from "next/font/google";
import { demoSlugs, getDemo } from "@/demos/registry";
import { todayIn } from "@/lib/demo/dates";
import DemoProvider from "@/components/demo/DemoProvider";
import DemoShell from "@/components/demo/DemoShell";
import "./demo.css";

// Headings: closest free match to the brand's Brothers OT (licensed via Adobe Fonts).
const display = Saira_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-demo-display", display: "swap" });
// Body: the brand site's own body font.
const body = Roboto_Condensed({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-demo-body", display: "swap" });

// Regenerate hourly so "today" (and every date in the demo) stays current.
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => demoSlugs.map((slug) => ({ slug }));

export async function generateMetadata({ params }: LayoutProps<"/demo/[slug]">): Promise<Metadata> {
  const cfg = getDemo((await params).slug);
  if (!cfg) return {};
  const title = `${cfg.company.appName} · ${cfg.company.name}`;
  const description = `Concept demo prepared for ${cfg.company.name} by Rose Revenue. Sample data: all names, accounts and numbers are fictional.`;
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

export const viewport: Viewport = { themeColor: "#1f2a1f" };

export default async function DemoLayout({ children, params }: LayoutProps<"/demo/[slug]">) {
  const { slug } = await params;
  const cfg = getDemo(slug);
  if (!cfg) notFound();
  const t = cfg.theme;
  const vars = {
    "--d-bg": t.bg, "--d-panel": t.panel, "--d-panel2": t.panel2, "--d-line": t.line, "--d-text": t.text, "--d-muted": t.muted,
    "--d-accent": t.accent, "--d-on-accent": t.onAccent, "--d-header": t.header, "--d-on-header": t.onHeader,
    "--d-good": t.good, "--d-bad": t.bad, "--d-warn": t.warn, "--d-info": t.info,
    ...Object.fromEntries(t.chart.map((c, i) => [`--d-c${i + 1}`, c])),
  } as CSSProperties;

  return (
    <div className={`demo-root ${display.variable} ${body.variable}`} style={vars}>
      <DemoProvider slug={slug} anchor={todayIn(cfg.timeZone)}>
        <DemoShell>{children}</DemoShell>
      </DemoProvider>
    </div>
  );
}
