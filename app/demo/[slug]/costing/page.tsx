import Costing from "@/components/demo/shop/modules/Costing";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("costing");

export default async function Page({ params }: PageProps<"/demo/[slug]/costing">) {
  await requireModule(params, "costing");
  return <Costing />;
}
