import Money from "@/components/demo/shop/modules/Money";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("money");

export default async function Page({ params }: PageProps<"/demo/[slug]/money">) {
  await requireModule(params, "money");
  return <Money />;
}
