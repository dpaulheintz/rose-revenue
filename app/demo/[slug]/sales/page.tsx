import FarmSales from "@/components/demo/farm/modules/Sales";
import ShopSales from "@/components/demo/shop/modules/Sales";
import { demoKind, moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("sales");

export default async function Page({ params }: PageProps<"/demo/[slug]/sales">) {
  await requireModule(params, "sales");
  return (await demoKind(params)) === "shop" ? <ShopSales /> : <FarmSales />;
}
