import { redirect } from "next/navigation";
import { getDemo } from "@/demos/registry";

// The shareable link is /demo/<slug>; the app opens on its first module.
export default async function Page({ params }: PageProps<"/demo/[slug]">) {
  const { slug } = await params;
  const cfg = getDemo(slug)!;
  redirect(`/demo/${slug}/${cfg.modules[0].path}`);
}
