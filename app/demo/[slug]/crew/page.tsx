import Crew from "@/components/demo/shop/modules/Crew";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("crew");

export default async function Page({ params }: PageProps<"/demo/[slug]/crew">) {
  await requireModule(params, "crew");
  return <Crew />;
}
