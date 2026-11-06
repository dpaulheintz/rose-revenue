import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getRegistered, registeredSlugs } from "@demos/registry";
import { todayIn } from "@demos/kit/data/dates";
import DemoProvider from "@demos/kit/shell/DemoProvider";
import DemoShell from "@demos/kit/shell/DemoShell";
import { lookVars, themeVars } from "@demos/kit/theme";
import "@demos/kit/kit.css";

// Regenerate hourly so "today" (and every date in the demo) stays current.
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => registeredSlugs.map((slug) => ({ slug }));

export async function generateMetadata({ params }: LayoutProps<"/demo/[slug]">): Promise<Metadata> {
  const demo = getRegistered((await params).slug);
  if (!demo) return {};
  const { config: cfg, meta } = demo;
  const app = meta.app ? { appleWebApp: { capable: true, title: meta.app.name, statusBarStyle: "default" as const }, icons: { apple: meta.app.icon } } : {};
  // The preview image comes from ./opengraph-image.tsx (drawn from the demo's brand colors).
  return {
    title: { default: meta.title, template: `%s · ${meta.title}` },
    description: meta.description,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: `/demo/${cfg.slug}` },
    openGraph: { type: "website", url: `/demo/${cfg.slug}`, siteName: "Rose Revenue", title: `${meta.title} (concept demo)`, description: meta.description },
    twitter: { card: "summary_large_image", title: `${meta.title} (concept demo)`, description: meta.description },
    ...app,
  };
}

export async function generateViewport({ params }: LayoutProps<"/demo/[slug]">): Promise<Viewport> {
  const demo = getRegistered((await params).slug);
  const look = demo?.config.look;
  return { themeColor: look?.themeColor ?? "#263421", ...(look?.viewportFit ? { viewportFit: look.viewportFit } : {}) };
}

export default async function DemoLayout({ children, params }: LayoutProps<"/demo/[slug]">) {
  const { slug } = await params;
  const demo = getRegistered(slug);
  if (!demo) notFound();
  const { config: cfg, Provider } = demo;
  const Shell = demo.Shell ?? DemoShell;
  // "Today" is fixed once, on the server, and handed down: the client rebuilds the same data.
  const anchor = todayIn(cfg.timeZone);
  const vars = { ...themeVars(cfg.theme), ...lookVars(cfg.look), ...demo.fontVars };

  return (
    <div className={`demo-root ${demo.fontClass}`} style={vars}>
      <DemoProvider cfg={cfg} anchor={anchor}>
        <Provider anchor={anchor}>
          <Shell>{children}</Shell>
        </Provider>
      </DemoProvider>
    </div>
  );
}
