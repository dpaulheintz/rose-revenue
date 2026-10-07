import Projects from "@/components/demo/farm/modules/Projects";
import { moduleMeta, requireModule } from "../_lib/module";

export const generateMetadata = moduleMeta("projects");

export default async function Page({ params }: PageProps<"/demo/[slug]/projects">) {
  await requireModule(params, "projects");
  return <Projects />;
}
