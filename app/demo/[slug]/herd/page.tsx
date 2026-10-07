import Herd from "@/components/demo/farm/modules/Herd";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("herd");

export default async function Page({ params }: PageProps<"/demo/[slug]/herd">) {
  await requireModule(params, "herd");
  return <Herd />;
}
