import Materials from "@/components/demo/shop/modules/Materials";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("materials");

export default async function Page({ params }: PageProps<"/demo/[slug]/materials">) {
  await requireModule(params, "materials");
  return <Materials />;
}
