import Inventory from "@/components/demo/farm/modules/Inventory";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("inventory");

export default async function Page({ params }: PageProps<"/demo/[slug]/inventory">) {
  await requireModule(params, "inventory");
  return <Inventory />;
}
