import Maintenance from "@/components/demo/farm/modules/Maintenance";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("maintenance");

export default async function Page({ params }: PageProps<"/demo/[slug]/maintenance">) {
  await requireModule(params, "maintenance");
  return <Maintenance />;
}
