import Warranty from "@/components/demo/shop/modules/Warranty";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("warranty");

export default async function Page({ params }: PageProps<"/demo/[slug]/warranty">) {
  await requireModule(params, "warranty");
  return <Warranty />;
}
