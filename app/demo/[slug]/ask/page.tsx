import FarmAsk from "@/components/demo/farm/modules/Ask";
import ShopAsk from "@/components/demo/shop/modules/Ask";
import { demoKind, moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("ask");

export default async function Page({ params }: PageProps<"/demo/[slug]/ask">) {
  await requireModule(params, "ask");
  return (await demoKind(params)) === "shop" ? <ShopAsk /> : <FarmAsk />;
}
