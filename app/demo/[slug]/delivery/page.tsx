import Delivery from "@/components/demo/farm/modules/Delivery";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("delivery");

export default async function Page({ params }: PageProps<"/demo/[slug]/delivery">) {
  await requireModule(params, "delivery");
  return <Delivery />;
}
