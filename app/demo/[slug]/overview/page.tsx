import Overview from "@/components/demo/farm/modules/Overview";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("overview");

export default async function Page({ params }: PageProps<"/demo/[slug]/overview">) {
  await requireModule(params, "overview");
  return <Overview />;
}
