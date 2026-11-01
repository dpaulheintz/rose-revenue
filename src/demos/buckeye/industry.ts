// EVERYTHING INDUSTRY-SPECIFIC LIVES HERE. Edit this one file and the demo becomes
// a food producer, plastics molder or metal fab shop: the data generator and every
// screen read their words and numbers from it. All names and numbers are invented.

export type Industry = typeof industry;

export const industry = {
  /* ---------- who they are ---------- */
  company: {
    name: "Buckeye Precision Machining",
    wordmark: ["Buckeye Precision", "Machining"] as [string, string],
    place: "Ohio",
    makes: "custom metal parts for agriculture and automotive customers",
    people: 35,
    contact: "Ohio · (419) 555-0100 · quotes@example.com",
  },
  brand: {
    accent: "#1c4e9e", // machinist's layout blue
    highlight: "#f2c230", // inspection-tag yellow
    header: "#1b1f22",
    bg: "#eceeef",
    mark: "gear" as const, // grass | mountain | gear
  },

  /* ---------- the words they use (nav and screens read these) ---------- */
  vocab: {
    job: "job", jobs: "jobs", Jobs: "Jobs", JobsNav: "Jobs & Production",
    part: "part", parts: "parts", Part: "Part",
    machine: "machine", machines: "machines", Machine: "Machine", MachinesNav: "Machine Maintenance",
    operator: "operator", Operator: "Operator",
    unit: "pcs",
    floor: "Shop floor", board: "Shop-floor board",
    material: "material", Materials: "Raw material", finished: "Finished goods",
    lot: "lot or heat number", Lot: "Lot", heat: "Heat",
    scrap: "scrap", Scrap: "Scrap",
    shipment: "shipment", shipments: "shipments", ship: "ship",
    nc: "nonconformance", NC: "Nonconformance",
    cert: "Mill cert",
    ask: "Ask the Shop", askConcept: "Concept: ask questions of your own shop.",
    shop: "shop", Job: "Job", app: "Shop system",
  },

  /* ---------- sentences that mention the trade ---------- */
  copy: {
    ogHeadline: "Your whole shop, on one screen.",
    ogSub: "Quotes, jobs, material, quality and cash. Entered once, built for your shop, and you own it.",
    description: "Quote to shipment in one system, for a shop you own.",
    emailOpen: "Thanks for the print.",
    emailIncludes: "Material cert and inspection report included.",
    tour: [
      { path: "dashboard", title: "Your morning, on one screen", say: "Every number here is computed from the same records. Tap a late job or the material alert to see why." },
      { path: "jobs", title: "Entered once, at the quote", say: "Open any job: routing, material, heat and the quote it came from. Switch to the board and drag a job to another machine." },
      { path: "quotes", title: "Price it from your own rates", say: "Pick the customer, part and machine time. It prices from your shop rates and margin, and one tap makes it a job." },
      { path: "inventory", title: "See the shortage before the machine waits", say: "This material runs out before an upcoming job needs it, and it's the same item flagged on the Dashboard." },
      { path: "quality", title: "A customer calls about a bad lot", say: "Type a lot or heat number: mill cert, job, machine, operator, inspection and ship date in seconds." },
      { path: "customers", title: "Know every account before you call", say: "Contacts, open orders, lifetime revenue, on-time %, visit notes, and who's about due to reorder." },
      { path: "maintenance", title: "Machines don't surprise you", say: "PM schedule, overdue flags, and what each breakdown cost in dollars and hours." },
      { path: "scorecard", title: "Your weekly meeting, ready to go", say: "Thirteen weeks of the numbers you already run on, plus to-dos and issues, with nobody building a spreadsheet." },
      { path: "ask", title: "And it can answer questions", say: "A concept: ask about your own SOPs and live data, with the source cited. This is yours: your code, your data, no vendor to rent from." },
    ],
  },

  /* ---------- number formats ---------- */
  formats: { part: "BP-#####", job: "J-", quote: "Q-", po: "PO-", nc: "NC-", lot: "L-", heat: "H-", invoice: "INV-", cert: "MC-" },

  /* ---------- customers ---------- */
  customerTypes: ["Agriculture", "Automotive"],
  customers: [
    ["Harlan Implement Works", "Agriculture", "Van Wert"], ["Tri-County Tillage Co.", "Agriculture", "Bucyrus"], ["Maumee Valley Planters", "Agriculture", "Defiance"],
    ["Sandusky Grain Handling", "Agriculture", "Fremont"], ["Prairie Line Equipment", "Agriculture", "Celina"], ["Corn Belt Hydraulics", "Agriculture", "Lima"],
    ["Redbird Harvester Parts", "Agriculture", "Wooster"], ["Northfield Sprayer Co.", "Agriculture", "Ashland"], ["Blanchard River Ag", "Agriculture", "Findlay"],
    ["Fallow Creek Machinery", "Agriculture", "Mansfield"], ["Big Walnut Feed Systems", "Agriculture", "Marion"], ["Scioto Bale Works", "Agriculture", "Chillicothe"],
    ["Union Seed Drill", "Agriculture", "Marysville"], ["Wabash Ag Components", "Agriculture", "Greenville"], ["Hollow Oak Augers", "Agriculture", "Tiffin"],
    ["Pelican Point Stamping", "Automotive", "Lorain"], ["Ironbridge Driveline", "Automotive", "Toledo"], ["Wren Hollow Axle", "Automotive", "Lima"],
    ["Larkfield Seat Frames", "Automotive", "Dayton"], ["Tallgrass Brake Components", "Automotive", "Springfield"], ["Quarry Road Tooling", "Automotive", "Elyria"],
    ["Rustbelt Fixture Co.", "Automotive", "Akron"], ["Bellwood Steering Systems", "Automotive", "Sandusky"], ["Great Black Swamp Gear", "Automotive", "Bowling Green"],
    ["Stony Ridge Suspension", "Automotive", "Canton"], ["Tolland Transfer Case", "Automotive", "Dayton"], ["Pine Knob Exhaust Hangers", "Automotive", "Akron"],
    ["Alder Run Powertrain", "Automotive", "Ravenna"], ["Delphos Pump Works", "Automotive", "Delphos"], ["Clearfork Clutch", "Automotive", "Mansfield"],
    ["Whetstone Mounts", "Automotive", "Bellefontaine"], ["Paint Creek Castings", "Automotive", "Xenia"], ["Olentangy Fasteners", "Automotive", "Delaware"],
    ["Hocking Tube Forming", "Automotive", "Lancaster"],
  ] as Array<[string, string, string]>,
  areaCodes: ["419", "937", "330", "614", "440"],
  contactRoles: ["Purchasing", "Supplier quality", "Plant engineer", "Materials manager", "Owner"],
  visitNotes: [
    "Walked the line. They want shorter lead times on repeat orders.", "Reviewed last quarter's on-time numbers. Happy with the trend.", "New print coming next month, wants a quote when it's released.",
    "Asked about holding safety stock on the shelf for them.", "Toured our shop with their new buyer.", "Talked through a tolerance change on the next revision.", "They're moving more work in-house to us if pricing holds.", "Followed up on a late shipment. Smoothed over.",
  ],

  /* ---------- materials ---------- */
  materials: [
    { id: "4140-2", name: "4140 steel round, 2 in", unit: "ft", cost: 14.5, kind: "Steel", supplier: "s1", leadDays: 9 },
    { id: "4140-3", name: "4140 steel round, 3 in", unit: "ft", cost: 31, kind: "Steel", supplier: "s1", leadDays: 11 },
    { id: "1018-1", name: "1018 steel round, 1 in", unit: "ft", cost: 4.2, kind: "Steel", supplier: "s1", leadDays: 5 },
    { id: "1018-2", name: "1018 steel round, 2 in", unit: "ft", cost: 11.8, kind: "Steel", supplier: "s1", leadDays: 5 },
    { id: "1045-15", name: "1045 steel round, 1.5 in", unit: "ft", cost: 8.9, kind: "Steel", supplier: "s2", leadDays: 7 },
    { id: "1045-25", name: "1045 steel round, 2.5 in", unit: "ft", cost: 22.4, kind: "Steel", supplier: "s2", leadDays: 7 },
    { id: "a36-plate", name: "A36 plate, 1/2 in", unit: "sq ft", cost: 19.5, kind: "Steel", supplier: "s2", leadDays: 6 },
    { id: "a36-bar", name: "A36 flat bar, 3 x 1/2 in", unit: "ft", cost: 7.4, kind: "Steel", supplier: "s2", leadDays: 6 },
    { id: "86l20", name: "8620 steel round, 2 in", unit: "ft", cost: 17.2, kind: "Steel", supplier: "s1", leadDays: 12 },
    { id: "d2-flat", name: "D2 tool steel flat, 1 x 3 in", unit: "ft", cost: 58, kind: "Tool steel", supplier: "s3", leadDays: 14 },
    { id: "a2-flat", name: "A2 tool steel flat, 3/4 x 2 in", unit: "ft", cost: 41, kind: "Tool steel", supplier: "s3", leadDays: 14 },
    { id: "304-1", name: "304 stainless round, 1 in", unit: "ft", cost: 16.8, kind: "Stainless", supplier: "s4", leadDays: 8 },
    { id: "316-2", name: "316 stainless round, 2 in", unit: "ft", cost: 62, kind: "Stainless", supplier: "s4", leadDays: 10 },
    { id: "17-4", name: "17-4 stainless round, 1.5 in", unit: "ft", cost: 71, kind: "Stainless", supplier: "s4", leadDays: 15 },
    { id: "6061-plate", name: "6061 aluminum plate, 1 in", unit: "sq ft", cost: 46, kind: "Aluminum", supplier: "s5", leadDays: 4 },
    { id: "6061-round", name: "6061 aluminum round, 2 in", unit: "ft", cost: 12.6, kind: "Aluminum", supplier: "s5", leadDays: 4 },
    { id: "7075-plate", name: "7075 aluminum plate, 3/4 in", unit: "sq ft", cost: 68, kind: "Aluminum", supplier: "s5", leadDays: 8 },
    { id: "932-bronze", name: "932 bearing bronze, 2 in", unit: "ft", cost: 88, kind: "Bronze", supplier: "s6", leadDays: 12 },
    { id: "ductile", name: "Ductile iron bar, 3 in", unit: "ft", cost: 27, kind: "Iron", supplier: "s6", leadDays: 10 },
    { id: "dom-tube", name: "DOM tube, 2 in OD x 1/4 wall", unit: "ft", cost: 13.9, kind: "Tube", supplier: "s2", leadDays: 7 },
    { id: "insert-c", name: "Carbide inserts, CNMG", unit: "box", cost: 96, kind: "Tooling", supplier: "s7", leadDays: 3 },
    { id: "coolant", name: "Cutting fluid concentrate", unit: "gal", cost: 34, kind: "Shop supply", supplier: "s7", leadDays: 3 },
    { id: "endmill", name: "Solid carbide end mills, 1/2 in", unit: "ea", cost: 42, kind: "Tooling", supplier: "s7", leadDays: 3 },
    { id: "cartons", name: "Corrugated parts cartons", unit: "ea", cost: 2.6, kind: "Shipping", supplier: "s8", leadDays: 2 },
  ],
  /** This material visibly runs out before an upcoming job needs it (Dashboard + Inventory). */
  runoutMaterial: "4140-3",
  suppliers: [
    { id: "s1", name: "Marlow Alloy Steel", kind: "Alloy steel" }, { id: "s2", name: "Quillan Metal Service", kind: "Carbon steel + tube" },
    { id: "s3", name: "Crestline Tool Steel", kind: "Tool steel" }, { id: "s4", name: "Fernwood Stainless Supply", kind: "Stainless" },
    { id: "s5", name: "Pike Lake Aluminum", kind: "Aluminum" }, { id: "s6", name: "Foundry Row Metals", kind: "Bronze + iron" },
    { id: "s7", name: "Millrace Industrial", kind: "Tooling + supplies" }, { id: "s8", name: "Buckhorn Packaging", kind: "Packaging" },
  ],

  /* ---------- machines + work centers ---------- */
  machines: [
    { id: "saw", name: "Band saw", center: "Saw", rate: 55, kind: "saw" },
    { id: "vf2", name: "VF-2 mill", center: "CNC milling", rate: 95, kind: "mill" },
    { id: "vmc2", name: "VMC 2", center: "CNC milling", rate: 95, kind: "mill" },
    { id: "vmc3", name: "VMC 3", center: "CNC milling", rate: 95, kind: "mill" },
    { id: "5ax", name: "5-axis mill", center: "5-axis", rate: 145, kind: "mill" },
    { id: "lathe1", name: "Lathe 1", center: "CNC turning", rate: 90, kind: "lathe" },
    { id: "lathe2", name: "Lathe 2", center: "CNC turning", rate: 90, kind: "lathe" },
    { id: "grind", name: "Surface grinder", center: "Grinding", rate: 80, kind: "grinder" },
    { id: "deburr", name: "Deburr cell", center: "Deburr", rate: 50, kind: "deburr" },
  ],
  hoursPerMachineWeek: 80, // two shifts
  /** Routing steps. `center` ties a step to machines; steps without one happen off the machines. */
  operations: {
    // share = how much of a part's setup + cycle time this step takes. inspect marks the quality step.
    saw: { label: "Saw", center: "Saw", share: 0.25 },
    mill: { label: "CNC mill", center: "CNC milling", share: 1 },
    five: { label: "5-axis", center: "5-axis", share: 1 },
    turn: { label: "CNC turn", center: "CNC turning", share: 0.8 },
    grind: { label: "Grind", center: "Grinding", share: 0.45 },
    deburr: { label: "Deburr", center: "Deburr", share: 0.3 },
    outside: { label: "Heat treat (outside)", outside: true },
    inspect: { label: "Inspect", inspect: true },
    ship: { label: "Ship" },
  } as Record<string, { label: string; center?: string; share?: number; outside?: boolean; inspect?: boolean }>,
  offMachineLane: "Inspection + shipping",

  operators: ["Dale Reeves", "Tina Mercer", "Luis Barlow", "Hank Oakley", "Rita Sayer", "Joel Tolliver", "Mona Keane", "Vince Dolan", "Erin Holt", "Grant Wren", "Nora Gage", "Kurt Fitch"],
  staff: [
    { id: "plant", name: "Marcus Hale", role: "Plant manager" }, { id: "quality", name: "Jill Abbott", role: "Quality lead" },
    { id: "sales", name: "Ivan Cobb", role: "Sales + estimating" }, { id: "buyer", name: "Dina Foley", role: "Purchasing" }, { id: "maint", name: "Frank Yost", role: "Maintenance" },
    { id: "owner", name: "Owner", role: "Owner" },
  ],

  /* ---------- what they make ---------- */
  partFamilies: [
    { name: "Hydraulic cylinder clevis", type: "Agriculture", materials: ["4140-3", "1045-25"], perPc: [0.3, 0.5], qty: [22, 180], cycleMin: [9, 16], setupHr: [1.5, 3], route: ["saw", "turn", "mill", "deburr", "inspect", "ship"] },
    { name: "PTO shaft yoke", type: "Agriculture", materials: ["4140-3", "86l20"], perPc: [0.35, 0.55], qty: [18, 135], cycleMin: [12, 22], setupHr: [2, 3.5], route: ["saw", "turn", "mill", "outside", "grind", "inspect", "ship"] },
    { name: "Planter row-unit bracket", type: "Agriculture", materials: ["a36-plate", "a36-bar"], perPc: [0.4, 0.8], qty: [45, 360], cycleMin: [4, 8], setupHr: [1, 2], route: ["saw", "mill", "deburr", "inspect", "ship"] },
    { name: "Auger drive coupling", type: "Agriculture", materials: ["1045-25", "1045-15"], perPc: [0.25, 0.45], qty: [27, 225], cycleMin: [6, 11], setupHr: [1, 2], route: ["saw", "turn", "deburr", "inspect", "ship"] },
    { name: "Sprayer manifold block", type: "Agriculture", materials: ["6061-plate", "7075-plate"], perPc: [0.3, 0.6], qty: [11, 90], cycleMin: [14, 26], setupHr: [2, 4], route: ["saw", "mill", "deburr", "inspect", "ship"] },
    { name: "Harvester sprocket hub", type: "Agriculture", materials: ["ductile", "1045-25"], perPc: [0.3, 0.5], qty: [18, 112], cycleMin: [10, 18], setupHr: [1.5, 3], route: ["saw", "turn", "mill", "inspect", "ship"] },
    { name: "Baler knotter shaft", type: "Agriculture", materials: ["4140-2", "1018-2"], perPc: [0.8, 1.4], qty: [22, 135], cycleMin: [8, 14], setupHr: [1.5, 2.5], route: ["saw", "turn", "outside", "grind", "inspect", "ship"] },
    { name: "Steering knuckle bushing", type: "Automotive", materials: ["932-bronze", "304-1"], perPc: [0.12, 0.25], qty: [90, 675], cycleMin: [2, 5], setupHr: [1, 2], route: ["saw", "turn", "deburr", "inspect", "ship"] },
    { name: "Transmission output flange", type: "Automotive", materials: ["4140-3", "86l20"], perPc: [0.2, 0.4], qty: [45, 405], cycleMin: [7, 13], setupHr: [2, 3], route: ["saw", "turn", "mill", "outside", "grind", "inspect", "ship"] },
    { name: "Brake caliper bracket", type: "Automotive", materials: ["ductile", "a36-plate"], perPc: [0.2, 0.35], qty: [90, 540], cycleMin: [5, 9], setupHr: [1.5, 2.5], route: ["saw", "mill", "deburr", "inspect", "ship"] },
    { name: "Seat-frame weld fixture", type: "Automotive", materials: ["a2-flat", "d2-flat"], perPc: [1.2, 2.4], qty: [1, 5], cycleMin: [180, 420], setupHr: [3, 6], route: ["saw", "five", "grind", "inspect", "ship"] },
    { name: "Axle spindle nut", type: "Automotive", materials: ["1045-15", "4140-2"], perPc: [0.1, 0.2], qty: [135, 900], cycleMin: [1.5, 3.5], setupHr: [1, 1.5], route: ["saw", "turn", "deburr", "inspect", "ship"] },
    { name: "Exhaust hanger boss", type: "Automotive", materials: ["304-1", "316-2"], perPc: [0.08, 0.16], qty: [135, 810], cycleMin: [2, 4], setupHr: [1, 1.5], route: ["saw", "turn", "inspect", "ship"] },
    { name: "Stamping die insert", type: "Automotive", materials: ["d2-flat", "a2-flat"], perPc: [0.6, 1.2], qty: [2, 14], cycleMin: [70, 160], setupHr: [2.5, 5], route: ["saw", "five", "outside", "grind", "inspect", "ship"] },
    { name: "Pump housing cover", type: "Automotive", materials: ["6061-round", "7075-plate"], perPc: [0.15, 0.3], qty: [45, 360], cycleMin: [5, 10], setupHr: [1.5, 2.5], route: ["saw", "turn", "mill", "deburr", "inspect", "ship"] },
  ],
  partVariants: ["", "LH", "RH", "Long", "Short", "HD"],
  outsideCostPerPc: 2.4, // e.g. heat treat, per piece
  defaultMargin: 0.32,
  history: { jobsPerMonth: 44, lateShare: 0.08, seasons: [1.1, 1.15, 1.1, 1, 0.95, 0.9, 0.85, 0.95, 1.05, 1.1, 1.05, 0.9] }, // Jan..Dec
  openJobs: 25,
  targets: { onTime: 95, scrap: 1.5, utilization: 65, cash: 70000, quotesWon: 8 },

  /* ---------- quality ---------- */
  scrapCauses: ["Dimension out of tolerance", "Tool wear / chatter", "Setup error", "Wrong revision on the floor", "Material flaw", "Handling damage", "Thread gauge no-go", "Surface finish"],
  dispositions: ["Scrap", "Rework", "Use as is (customer OK)"],
  inspectionSteps: ["First-article approved", "Critical diameters within tolerance", "Thread gauge go / no-go", "Surface finish meets print", "Deburred, no sharp edges", "Part marked with lot number", "Material cert on file", "Count verified against traveler"],

  /* ---------- maintenance ---------- */
  pmTasks: {
    saw: [["Replace blade + check guides", 30], ["Coolant + chip tray clean-out", 14]],
    mill: [["Way lube + coolant check", 7], ["Spindle warm-up + runout check", 30], ["Ball-screw backlash check", 90]],
    lathe: [["Chuck grease + jaw check", 7], ["Turret alignment check", 60], ["Hydraulic filter", 90]],
    grinder: [["Wheel dress + balance", 30], ["Way oil + filter", 45]],
    deburr: [["Media + compound change", 21], ["Dust collector filter", 45]],
  } as Record<string, Array<[string, number]>>,
  repairs: ["Spindle bearing replaced", "Coolant pump rebuilt", "Way cover torn, replaced", "Chuck jaw cracked, replaced", "Servo drive fault, reset + cable", "Tool changer arm aligned", "Hydraulic hose burst", "Saw blade guide replaced", "Limit switch replaced", "Encoder cable replaced"],

  /* ---------- connected systems strip ---------- */
  systems: [["QuickBooks", 12], ["Shop floor", 1], ["Quoting", 4], ["Inventory", 2]] as Array<[string, number]>, // [name, minutes since last sync]

  /* ---------- weekly meeting ---------- */
  todos: [
    ["Call Marlow about expediting bar stock", "buyer", 2], ["Send first-article report to Ironbridge", "quality", 1], ["Quote the Harlan clevis reorder", "sales", 3],
    ["Replace VMC 3 way cover", "maint", 4], ["Cross-train second operator on 5-axis", "plant", 12], ["Review late jobs with night shift", "plant", 1],
    ["Update setup sheet for VF-2 fixture", "plant", 6], ["Book annual gauge calibration", "quality", 14],
  ] as Array<[string, string, number]>,
  issues: ["Second-shift setups running long on lathes", "Bar stock lead times slipping", "Too many hot jobs interrupting the schedule", "Revision control on the floor", "Hiring: one more 5-axis operator"],

  /* ---------- questions on "Ask the Shop" (each answered from a document below) ---------- */
  asks: [
    { q: "What's the setup sheet for the VF-2 fixture?", match: "setup|fixture|vf-?2", sop: "SOP-211" },
    { q: "How do we handle a nonconformance?", match: "nonconform|\\bnc\\b|bad part|reject", sop: "SOP-104" },
    { q: "What do we do on first article?", match: "first.?article|first piece", sop: "SOP-118" },
    { q: "How do we receive material?", match: "receiv|mill cert|\\bcert", sop: "SOP-305" },
    { q: "What's the lockout procedure?", match: "lockout|lock out|tag", sop: "SOP-410" },
  ],

  /* ---------- documents behind "Ask the Shop" ---------- */
  sops: [
    { id: "SOP-104", title: "How we handle a nonconformance", body: "Stop and tag the parts red. Log it in Quality with the job, quantity and cause. The quality lead decides scrap, rework or customer use-as-is within one shift. If it could have shipped, check the last lot too." },
    { id: "SOP-211", title: "VF-2 fixture setup sheet", body: "Fixture plate F-12 on the table, keys in the T-slot, indicate within .001 in. Probe G54 off the left jaw and top of stock. Tools 1-8 per the traveler. Run the first piece at 50% rapid and get a first-article sign-off before running the lot." },
    { id: "SOP-118", title: "First-article inspection", body: "The first good piece from every setup goes to the quality bench with the print and traveler. Every critical dimension is checked and signed before the lot runs. Save the report to the job." },
    { id: "SOP-305", title: "Receiving material + mill certs", body: "Check the count and heat number against the PO and match the mill cert. Mark the heat number on the bar, then log it in Inventory so every job that uses it can be traced." },
    { id: "SOP-122", title: "Lot traceability", body: "Each job gets a lot number that ties together the material heat, machine, operator, inspection results and ship date. The lot goes on the part or its label, and on the packing slip." },
    { id: "SOP-410", title: "Lockout before maintenance", body: "Power off, lock and tag the disconnect, bleed air and hydraulics, and try the start button before reaching in. Only the person who put a lock on takes it off." },
    { id: "SOP-220", title: "Shift handoff", body: "Leave the traveler at the machine with the count, tool notes and anything running tight. Walk the next operator through any open problem before you clock out." },
  ],
};
