import Production from "@/components/demo/farm/modules/Production";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("production");

export default async function Page({ params }: PageProps<"/demo/[slug]/production">) {
  await requireModule(params, "production");
  return <Production />;
}
