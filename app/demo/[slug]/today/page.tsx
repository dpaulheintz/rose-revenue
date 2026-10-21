import Today from "@/components/demo/shop/modules/Today";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("today");

export default async function Page({ params }: PageProps<"/demo/[slug]/today">) {
  await requireModule(params, "today");
  return <Today />;
}
