// What Simple Times makes and the words of its world. Product names are the
// brand's real public ones (Syrup Project flavors are placeholders); every
// account, client, person, number and record is invented.

export type BrandKey = "mixers" | "syrup";
export const BRANDS: Record<BrandKey, { key: BrandKey; name: string; full: string; color: string; ink: string; tint: string }> = {
  mixers: { key: "mixers", name: "Mixers", full: "Simple Times Mixers", color: "#da5856", ink: "#b8393a", tint: "#fbe7e6" },
  syrup: { key: "syrup", name: "Syrup Project", full: "The Syrup Project", color: "#923a4c", ink: "#923a4c", tint: "#f3e3e7" },
};
export const BRAND_KEYS: BrandKey[] = ["mixers", "syrup"];

/** Peak months (0 = Jan): mixers in summer and the holidays, syrups steady with a fall bump. */
export const SEASON: Record<BrandKey, number[]> = {
  mixers: [0.7, 0.72, 0.85, 0.95, 1.1, 1.3, 1.38, 1.3, 1.0, 1.05, 1.3, 1.5],
  syrup: [0.95, 0.95, 0.98, 0.98, 0.95, 0.92, 0.9, 0.95, 1.1, 1.22, 1.2, 1.08],
};

export type Product = { id: string; brand: BrandKey; name: string; kind: string; base: string };
export const PRODUCTS: Product[] = [
  { id: "cacm", brand: "mixers", name: "Cranberry Apple Cider Mule", kind: "Mule", base: "cider" },
  { id: "cam", brand: "mixers", name: "Chai Apple Mule", kind: "Mule", base: "cider" },
  { id: "bbs", brand: "mixers", name: "Blackberry Smash", kind: "Smash", base: "berry" },
  { id: "pam", brand: "mixers", name: "Pineapple Mule", kind: "Mule", base: "ginger" },
  { id: "bbl", brand: "mixers", name: "Blueberry Basil Lemonade", kind: "Lemonade", base: "lemon" },
  { id: "prm", brand: "mixers", name: "Pear Rosemary Mule", kind: "Mule", base: "ginger" },
  { id: "ofs", brand: "mixers", name: "Old Fashioned Cocktail Syrup", kind: "Cocktail syrup", base: "syrup" },
  { id: "mjs", brand: "mixers", name: "Mojito Cocktail Syrup", kind: "Cocktail syrup", base: "syrup" },
  { id: "vb", brand: "syrup", name: "Vanilla Bean", kind: "Café syrup", base: "syrup" },
  { id: "bsc", brand: "syrup", name: "Brown Sugar Cinnamon", kind: "Café syrup", base: "syrup" },
  { id: "lh", brand: "syrup", name: "Lavender Honey", kind: "Café syrup", base: "syrup" },
  { id: "dem", brand: "syrup", name: "Demerara", kind: "Bar syrup", base: "syrup" },
  { id: "spm", brand: "syrup", name: "Spiced Maple", kind: "Café syrup", base: "syrup" },
];
export const BUNDLES = ["Autumn Nights Bundle", "Fall Bundle", "Fall Variety 6-Pack", "Sampler Pack"];

export type Sku = { id: string; brand: BrandKey; product: string; name: string; format: string; wholesale: number; retail: number; cost: number; units: number };
/** 30 SKUs: each mixer as a bottle and a case of 6, the four DTC bundles, each syrup as a bottle and a case of 6. */
export const SKUS: Sku[] = [
  ...PRODUCTS.filter((p) => p.brand === "mixers").flatMap((p) => [
    { id: `${p.id}-1`, brand: p.brand, product: p.id, name: p.name, format: "Bottle", wholesale: 9, retail: 14.99, cost: 3.9, units: 1 },
    { id: `${p.id}-6`, brand: p.brand, product: p.id, name: p.name, format: "Case of 6", wholesale: 51, retail: 84, cost: 23.4, units: 6 },
  ]),
  ...BUNDLES.map((b, i) => ({ id: `bundle-${i}`, brand: "mixers" as const, product: "bundle", name: b, format: "Bundle", wholesale: 0, retail: [49, 44, 79, 29][i], cost: [19, 17, 30, 11][i], units: [3, 3, 6, 4][i] })),
  ...PRODUCTS.filter((p) => p.brand === "syrup").flatMap((p) => [
    { id: `${p.id}-1`, brand: p.brand, product: p.id, name: p.name, format: "Bottle", wholesale: 11.5, retail: 18, cost: 4.4, units: 1 },
    { id: `${p.id}-6`, brand: p.brand, product: p.id, name: p.name, format: "Case of 6", wholesale: 66, retail: 104, cost: 26.4, units: 6 },
  ]),
];

/* ---------- accounts (invented names) ---------- */
export type AccountType = "Bar" | "Restaurant" | "Coffee shop" | "Grocery" | "Liquor store" | "Distributor";
export const ACCOUNT_TYPES: Array<{ type: AccountType; n: number; carry: [number, number, number]; cadence: [number, number]; cases: [number, number]; channel: "Wholesale" | "Retail" | "Distributor" }> = [
  // carry = share carrying [Mixers only, Syrup Project only, both]
  { type: "Bar", n: 28, carry: [0.52, 0.1, 0.38], cadence: [18, 34], cases: [2, 6], channel: "Wholesale" },
  { type: "Restaurant", n: 22, carry: [0.6, 0.08, 0.32], cadence: [21, 40], cases: [2, 5], channel: "Wholesale" },
  { type: "Coffee shop", n: 22, carry: [0.04, 0.66, 0.3], cadence: [14, 28], cases: [3, 8], channel: "Wholesale" },
  { type: "Grocery", n: 18, carry: [0.72, 0.04, 0.24], cadence: [14, 30], cases: [4, 12], channel: "Retail" },
  { type: "Liquor store", n: 22, carry: [0.72, 0.04, 0.24], cadence: [21, 42], cases: [3, 10], channel: "Retail" },
  { type: "Distributor", n: 8, carry: [0.38, 0.12, 0.5], cadence: [28, 45], cases: [18, 48], channel: "Distributor" },
];
const W = {
  bar: ["Bramble", "Copper Kettle", "Velvet Fox", "Lantern", "Juniper", "Brass Owl", "Hollow Oak", "Foxglove", "Willow", "Marigold", "Ember", "Cobalt", "Saffron", "Thistle", "Night Heron", "Gilded Pear", "Paper Moon", "Wild Goose", "Ironwood", "Bluebell", "Tin Roof", "Larkspur", "Black Walnut", "Ruby Fern", "Crooked Elm", "Silver Birch", "Painted Duck", "Little Owl"],
  barN: ["Room", "Social", "Lounge", "Parlor", "Cellar", "Taproom", "Tavern"],
  rest: ["Fennel", "Corner Table", "Sorrel", "Two Forks", "Harvest Moon", "Blue Plate", "Old Oak", "Sweet Clover", "Hearth", "Brick Oven", "Linden", "Copper Pot", "Wren", "Tallgrass", "Pepper Mill", "Cedar", "Ash & Ember", "Mill Race", "Garden Gate", "Chestnut", "Saltbox", "Meadowlark"],
  restN: ["Kitchen", "Table", "Bistro", "Eatery", "Supper Club", "Grill"],
  cafe: ["Bluebird", "Sparrow", "Kettle Hill", "Fernway", "Two Rivers", "Morning Dove", "Honeycomb", "Driftwood", "North Star", "Paper Lantern", "Little Fox", "Wildflower", "Cardinal", "Oak & Ivy", "Stillwater", "Foxtail", "Maple Leaf", "Robin's Nest", "Daybreak", "Sunflower", "Pine Cone", "Mockingbird"],
  cafeN: ["Coffee", "Roasters", "Espresso Bar", "Coffee House", "Café"],
  groc: ["Hollow Pine", "Green Acre", "Field Day", "Harvest Basket", "Oak Hill", "Sunrise", "Fresh Fields", "Corner Basket", "Clover Leaf", "Golden Wheat", "Prairie Rose", "Twin Silo", "Apple Barn", "Sweet Meadow", "Brookside", "Hilltop", "Red Barn", "Riverside"],
  grocN: ["Market", "Fresh Market", "Co-op", "Grocer", "Pantry"],
  liq: ["Cork & Barrel", "Bottle Rocket", "Cask & Crown", "Top Shelf", "Barrel House", "Copper Still", "Stone Arch", "Four Corners", "Long Pour", "High Street", "Last Call", "Grain & Grape", "Old Mill", "Two Barrels", "Spirit Lane", "North Gate", "Tall Glass", "Blue Door", "Red Fox", "Highball", "Pour House", "Keg & Cork"],
  liqN: ["Wine & Spirits", "Bottle Shop", "Beverage", "Spirits"],
  dist: ["Three Bridges", "Buckeye Trail", "Heartland Pour", "Great Plains", "Lakeshore", "Northcoast Craft", "Riverbend", "Crossroads"],
  distN: ["Beverage Distributors", "Craft Distribution", "Beverage Co.", "Spirits Supply"],
};
export const NAME_POOLS: Record<AccountType, [string[], string[]]> = {
  Bar: [W.bar, W.barN], Restaurant: [W.rest, W.restN], "Coffee shop": [W.cafe, W.cafeN], Grocery: [W.groc, W.grocN], "Liquor store": [W.liq, W.liqN], Distributor: [W.dist, W.distN],
};
export const TOWNS = ["Gahanna", "Westerville", "Worthington", "Dublin", "Hilliard", "Grandview", "Bexley", "New Albany", "Reynoldsburg", "Delaware", "Granville", "Lancaster", "Newark", "Powell", "Upper Arlington", "Pickerington", "Canal Winchester", "Clintonville", "German Village", "Lewis Center", "Groveport", "Blacklick", "Johnstown", "Sunbury", "Marysville", "Plain City", "Pataskala", "Short North"];
export const ROLES: Record<AccountType, string[]> = {
  Bar: ["Bar manager", "Owner", "Head bartender"], Restaurant: ["General manager", "Bar lead", "Owner"], "Coffee shop": ["Owner", "Café manager"],
  Grocery: ["Beverage buyer", "Store manager"], "Liquor store": ["Owner", "Buyer"], Distributor: ["Brand manager", "Purchasing"],
};
export const VISIT_NOTES = [
  "Dropped off fall samples. Pear Rosemary went over well with staff.", "Rebuilt the shelf facing. Moved Mules to eye level.", "Talked holiday menu. Wants a cranberry cocktail for December.",
  "Checked stock: low on Blackberry Smash. Reorder likely next week.", "New bar manager. Walked through the full line.", "Asked about case pricing at 10+ cases.",
  "Left Syrup Project samples for the café side.", "Shelf talkers up. They'll feature us in their weekend newsletter.", "Staff training on the Old Fashioned syrup.",
  "Display end cap approved for the holidays.", "Following up on a missed delivery. All good now.", "They're adding a mocktail list. Lemonades fit.",
];

/* ---------- people (invented) ---------- */
export const REPS = [
  { id: "you", name: "You" },
  { id: "r1", name: "Kara Lott" },
  { id: "r2", name: "Dale Ewing" },
];

/* ---------- marketing calendar: the shape of a year (month 1-12, day) ---------- */
export type EventKind = "Launch" | "Promo" | "Social" | "Email" | "Trade show" | "Event";
export const EVENT_KINDS: EventKind[] = ["Launch", "Promo", "Social", "Email", "Trade show", "Event"];
export const YEAR_PLAN: Array<{ m: number; d: number; days?: number; kind: EventKind; brand: BrandKey | "both"; title: string }> = [
  { m: 1, d: 6, kind: "Promo", brand: "mixers", title: "Dry January: lemonades as mocktails" }, { m: 1, d: 20, kind: "Email", brand: "syrup", title: "Café winter menu ideas" },
  { m: 2, d: 3, kind: "Social", brand: "mixers", title: "Valentine's cocktails reel" }, { m: 2, d: 18, days: 2, kind: "Trade show", brand: "both", title: "Central Ohio Beverage Buyers Day" },
  { m: 3, d: 10, kind: "Launch", brand: "syrup", title: "Lavender Honey spring launch" }, { m: 3, d: 24, kind: "Email", brand: "mixers", title: "Spring patio season is coming" },
  { m: 4, d: 14, kind: "Promo", brand: "mixers", title: "Derby Day mint promo" }, { m: 4, d: 28, kind: "Social", brand: "syrup", title: "Iced latte season posts" },
  { m: 5, d: 2, kind: "Promo", brand: "mixers", title: "Cinco de Mayo bar kit" }, { m: 5, d: 19, kind: "Launch", brand: "mixers", title: "Summer lemonades back in stock" },
  { m: 6, d: 9, kind: "Event", brand: "mixers", title: "Patio party at the tasting room" }, { m: 6, d: 23, kind: "Email", brand: "mixers", title: "4th of July pitcher recipes" },
  { m: 7, d: 14, days: 3, kind: "Trade show", brand: "both", title: "Great Lakes Hospitality Show" }, { m: 7, d: 28, kind: "Social", brand: "mixers", title: "Pool day mules series" },
  { m: 8, d: 11, kind: "Promo", brand: "syrup", title: "Back-to-school café bundle" }, { m: 8, d: 25, kind: "Launch", brand: "mixers", title: "Fall flavors pre-order" },
  { m: 9, d: 8, kind: "Launch", brand: "mixers", title: "Cranberry Apple Cider Mule returns" }, { m: 9, d: 15, kind: "Promo", brand: "syrup", title: "Brown Sugar Cinnamon fall menu push" },
  { m: 9, d: 29, kind: "Email", brand: "mixers", title: "Fall Bundle is here" }, { m: 10, d: 6, kind: "Social", brand: "mixers", title: "Chai Apple Mule fireside reel" },
  { m: 10, d: 13, kind: "Promo", brand: "mixers", title: "Autumn Nights Bundle feature" }, { m: 10, d: 20, kind: "Email", brand: "syrup", title: "Spiced Maple for coffee accounts" },
  { m: 10, d: 27, kind: "Event", brand: "both", title: "Fall tasting weekend at the shop" }, { m: 11, d: 3, kind: "Social", brand: "mixers", title: "Thanksgiving cocktail: Pear Rosemary Mule" },
  { m: 11, d: 10, kind: "Promo", brand: "mixers", title: "Holiday gifting: bundles go live" }, { m: 11, d: 12, kind: "Email", brand: "syrup", title: "Café holiday menu kit to coffee accounts" },
  { m: 11, d: 17, kind: "Social", brand: "both", title: "Gift guide series, week 1" }, { m: 11, d: 24, kind: "Social", brand: "both", title: "Gift guide series, week 2" },
  { m: 11, d: 27, kind: "Email", brand: "mixers", title: "Black Friday: Sampler Pack deal" }, { m: 11, d: 29, kind: "Event", brand: "both", title: "Small Business Saturday in the shop" },
  { m: 12, d: 1, kind: "Email", brand: "mixers", title: "Last order dates for holiday shipping" }, { m: 12, d: 4, days: 2, kind: "Trade show", brand: "both", title: "Holiday Makers Market" },
  { m: 12, d: 8, kind: "Social", brand: "mixers", title: "Twelve cocktails of Christmas" }, { m: 12, d: 15, kind: "Promo", brand: "syrup", title: "Gift a Syrup Project set" },
];

/* ---------- co-packing ---------- */
export const STAGES = ["Inquiry", "Formulation", "Sample", "Quote", "Contract", "Production", "Repeat"] as const;
export type Stage = (typeof STAGES)[number];
export const CLIENTS: Array<{ name: string; products: string[]; stage: Stage; minRun: number; next: string }> = [
  { name: "Hollow Pine Ginger Beer", products: ["Ginger beer concentrate"], stage: "Repeat", minRun: 300, next: "Confirm January run date" },
  { name: "Little Fawn Shrub Co.", products: ["Raspberry shrub", "Peach shrub"], stage: "Repeat", minRun: 150, next: "Send new label proofs" },
  { name: "Ridgeback Cold Brew", products: ["Cold brew concentrate"], stage: "Production", minRun: 250, next: "Book February run" },
  { name: "Saltbox Bloody Mary Mix", products: ["Bloody Mary mix"], stage: "Production", minRun: 200, next: "Ship finished goods" },
  { name: "Harbor Light Margarita Co.", products: ["Margarita mix", "Spicy margarita mix"], stage: "Production", minRun: 300, next: "QA sign-off on lot" },
  { name: "Juniper Lane Tonic", products: ["Tonic syrup"], stage: "Contract", minRun: 150, next: "Countersign supply agreement" },
  { name: "Sundial Switchel", products: ["Apple cider switchel"], stage: "Quote", minRun: 200, next: "Follow up on quote" },
  { name: "Kettle Creek Iced Tea", products: ["Sweet tea", "Peach tea"], stage: "Quote", minRun: 400, next: "Revise for 2 SKUs" },
  { name: "Prairie Bloom Lemonade", products: ["Lavender lemonade"], stage: "Sample", minRun: 150, next: "Tasting call Thursday" },
  { name: "Mossy Rock Grenadine", products: ["Grenadine"], stage: "Sample", minRun: 100, next: "Second sample round" },
  { name: "Field & Fable Agua Fresca", products: ["Watermelon agua fresca"], stage: "Formulation", minRun: 250, next: "Shelf-life test results" },
  { name: "Copperline Coffee Syrups", products: ["Hazelnut syrup", "Caramel syrup"], stage: "Formulation", minRun: 200, next: "Adjust sweetness, v3" },
  { name: "Bright Acre Hard Cider Co.", products: ["Mulling syrup"], stage: "Inquiry", minRun: 100, next: "Intro call" },
  { name: "Two Creek Tea Co.", products: ["Chai concentrate"], stage: "Inquiry", minRun: 200, next: "Send capabilities sheet" },
  { name: "Northwind Mocktail Co.", products: ["Spritz base"], stage: "Inquiry", minRun: 150, next: "NDA, then samples" },
];
export const LINES = [
  { id: "k1", name: "Kettle 1", note: "150 gal" },
  { id: "k2", name: "Kettle 2", note: "300 gal" },
  { id: "k3", name: "Syrup kettle", note: "120 gal" },
];
export const RUN_STATUSES = ["Scheduled", "Batching", "Bottling", "QA hold", "Released", "Shipped"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];
export const OPERATORS = ["Nora Gage", "Luis Barlow", "Tina Mercer", "Joel Tolliver"];
export const QA_CHECKS = ["Brix in range", "pH under 4.0", "Fill level", "Cap torque", "Label and lot code", "Taste panel"];
/** Ingredients used by recipe base, per gallon of finished product. */
export const RECIPES: Record<string, Array<[string, number]>> = {
  ginger: [["ginger", 0.18], ["lime", 0.12], ["sugar", 1.1]],
  cider: [["cider", 0.45], ["ginger", 0.1], ["sugar", 0.8], ["cranberry", 0.08]],
  berry: [["blackberry", 0.3], ["lemon", 0.15], ["sugar", 1.0]],
  lemon: [["lemon", 0.3], ["blueberry", 0.12], ["sugar", 1.2]],
  syrup: [["sugar", 4.2], ["vanilla", 0.02], ["citric", 0.01]],
  client: [["sugar", 2.0], ["citric", 0.02], ["lemon", 0.1]],
};
export const INGREDIENTS: Array<{ id: string; name: string; unit: string; cost: number; supplier: string; lead: number; kind: "Ingredient" | "Bottles" | "Caps" | "Labels" | "Cartons" }> = [
  { id: "sugar", name: "Organic cane sugar", unit: "lb", cost: 0.92, supplier: "Heartland Sugar Co.", lead: 5, kind: "Ingredient" },
  { id: "ginger", name: "Fresh ginger juice", unit: "gal", cost: 38, supplier: "Fair Lane Juicery", lead: 9, kind: "Ingredient" },
  { id: "lime", name: "Lime juice, NFC", unit: "gal", cost: 22, supplier: "Great Lakes Citrus Supply", lead: 6, kind: "Ingredient" },
  { id: "lemon", name: "Lemon juice, NFC", unit: "gal", cost: 19, supplier: "Great Lakes Citrus Supply", lead: 6, kind: "Ingredient" },
  { id: "cider", name: "Apple cider, Ohio-pressed", unit: "gal", cost: 7.5, supplier: "Orchard Row Farms", lead: 4, kind: "Ingredient" },
  { id: "cranberry", name: "Cranberry purée", unit: "gal", cost: 29, supplier: "Fair Lane Juicery", lead: 8, kind: "Ingredient" },
  { id: "blackberry", name: "Blackberry purée", unit: "gal", cost: 34, supplier: "Fair Lane Juicery", lead: 8, kind: "Ingredient" },
  { id: "blueberry", name: "Blueberry purée", unit: "gal", cost: 31, supplier: "Fair Lane Juicery", lead: 8, kind: "Ingredient" },
  { id: "vanilla", name: "Vanilla bean extract", unit: "gal", cost: 210, supplier: "Spice Route Imports", lead: 12, kind: "Ingredient" },
  { id: "citric", name: "Citric acid", unit: "lb", cost: 2.1, supplier: "Heartland Sugar Co.", lead: 5, kind: "Ingredient" },
  { id: "b750", name: "Glass bottles, 750 ml", unit: "ea", cost: 0.62, supplier: "Lakeside Glass Supply", lead: 14, kind: "Bottles" },
  { id: "b375", name: "Glass bottles, 375 ml", unit: "ea", cost: 0.44, supplier: "Lakeside Glass Supply", lead: 14, kind: "Bottles" },
  { id: "caps", name: "Caps, 38 mm tamper-evident", unit: "ea", cost: 0.06, supplier: "Lakeside Glass Supply", lead: 10, kind: "Caps" },
  { id: "lbl-st", name: "Labels: Simple Times", unit: "ea", cost: 0.09, supplier: "Short North Print", lead: 7, kind: "Labels" },
  { id: "lbl-sp", name: "Labels: Syrup Project", unit: "ea", cost: 0.11, supplier: "Short North Print", lead: 7, kind: "Labels" },
  { id: "ctn6", name: "Shipping cartons, 6-pack", unit: "ea", cost: 0.85, supplier: "Buckhorn Packaging", lead: 6, kind: "Cartons" },
];
/** The ingredient that visibly runs short before a scheduled run (Home + Inventory). */
export const RUNOUT_INGREDIENT = "ginger";
