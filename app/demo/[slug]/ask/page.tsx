import Ask from "@/components/demo/farm/modules/Ask";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("ask");

export default async function Page({ params }: PageProps<"/demo/[slug]/ask">) {
  await requireModule(params, "ask");
  return <Ask />;
}
