// Shop HQ for this prospect: everything comes from ./prospect.ts.
import { shopHqConfig } from "../templates/shop-hq/config";
import { prospect } from "./prospect";

export const config = shopHqConfig(prospect);
