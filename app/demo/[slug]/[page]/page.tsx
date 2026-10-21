import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRegistered, registeredSlugs } from "@demos/registry";

// Every demo screen: /demo/<slug>/<nav path>, rendered by that demo's own (lazy) screen loader.
export const dynamicParams = false;
export const generateStaticParams = () =>
  registeredSlugs.flatMap((slug) => getRegistered(slug)!.config.modules.map((m) => ({ slug, page: m.path })));

const screen = (slug: string, page: string) => {
  const demo = getRegistered(slug);
  const m = demo?.config.modules.find((x) => x.path === page);
  return m && demo ? { m, Screen: demo.Screen } : null;
};

export async function generateMetadata({ params }: PageProps<"/demo/[slug]/[page]">): Promise<Metadata> {
  const { slug, page } = await params;
  const s = screen(slug, page);
  return s ? { title: s.m.label } : {};
}

export default async function Page({ params }: PageProps<"/demo/[slug]/[page]">) {
  const { slug, page } = await params;
  const s = screen(slug, page);
  if (!s) notFound();
  return <s.Screen id={s.m.key} />;
}
