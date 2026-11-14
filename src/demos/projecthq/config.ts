// Project HQ for this prospect: everything comes from ./prospect.ts.
import { projectHqConfig } from "../templates/project-hq/config";
import { prospect } from "./prospect";

export const config = projectHqConfig(prospect);
