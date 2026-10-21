import ChangeOrders from "@/components/demo/shop/modules/ChangeOrders";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("change-orders");

export default async function Page({ params }: PageProps<"/demo/[slug]/change-orders">) {
  await requireModule(params, "change-orders");
  return <ChangeOrders />;
}
