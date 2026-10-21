import FarmCustomers from "@/components/demo/farm/modules/Customers";
import ShopCustomers from "@/components/demo/shop/modules/Customers";
import { demoKind, moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("customers");

export default async function Page({ params }: PageProps<"/demo/[slug]/customers">) {
  await requireModule(params, "customers");
  return (await demoKind(params)) === "shop" ? <ShopCustomers /> : <FarmCustomers />;
}
