import { redirect } from "next/navigation";
import { getRegistered } from "@demos/registry";

// The shareable link is /demo/<slug>; the app opens on its first nav item.
export default async function Page({ params }: PageProps<"/demo/[slug]">) {
  const { slug } = await params;
  const demo = getRegistered(slug)!;
  redirect(`/demo/${slug}/${demo.config.modules[0].path}`);
}
