import Sales from "@/components/demo/farm/modules/Sales";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("sales");

export default async function Page({ params }: PageProps<"/demo/[slug]/sales">) {
  await requireModule(params, "sales");
  return <Sales />;
}
