import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDemo } from "@/demos/registry";

/** Page title + 404 for demos that don't include this module. */
export function moduleMeta(key: string) {
  return async ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
    const m = getDemo((await params).slug)?.modules.find((x) => x.key === key);
    return m ? { title: m.label } : {};
  };
}

export async function requireModule(params: Promise<{ slug: string }>, key: string) {
  const cfg = getDemo((await params).slug);
  if (!cfg?.modules.some((m) => m.key === key)) notFound();
}
