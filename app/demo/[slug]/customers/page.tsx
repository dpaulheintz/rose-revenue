import Customers from "@/components/demo/farm/modules/Customers";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("customers");

export default async function Page({ params }: PageProps<"/demo/[slug]/customers">) {
  await requireModule(params, "customers");
  return <Customers />;
}
