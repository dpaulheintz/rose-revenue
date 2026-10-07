import Poultry from "@/components/demo/farm/modules/Poultry";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("poultry");

export default async function Page({ params }: PageProps<"/demo/[slug]/poultry">) {
  await requireModule(params, "poultry");
  return <Poultry />;
}
