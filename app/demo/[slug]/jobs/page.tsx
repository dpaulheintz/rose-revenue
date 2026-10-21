import Jobs from "@/components/demo/shop/modules/Jobs";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("jobs");

export default async function Page({ params }: PageProps<"/demo/[slug]/jobs">) {
  await requireModule(params, "jobs");
  return <Jobs />;
}
