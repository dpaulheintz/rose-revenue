import Photos from "@/components/demo/shop/modules/Photos";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("photos");

export default async function Page({ params }: PageProps<"/demo/[slug]/photos">) {
  await requireModule(params, "photos");
  return <Photos />;
}
