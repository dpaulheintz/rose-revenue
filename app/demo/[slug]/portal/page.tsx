import Portal from "@/components/demo/shop/modules/Portal";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("portal");

export default async function Page({ params }: PageProps<"/demo/[slug]/portal">) {
  await requireModule(params, "portal");
  return <Portal />;
}
