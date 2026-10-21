import Permits from "@/components/demo/shop/modules/Permits";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("permits");

export default async function Page({ params }: PageProps<"/demo/[slug]/permits">) {
  await requireModule(params, "permits");
  return <Permits />;
}
