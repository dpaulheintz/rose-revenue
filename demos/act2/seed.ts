// Seed data for the Act 2 Mechanical concept demo. Job mix, price ranges and
// workflows are typical for a small Central Ohio home-construction +
// mechanical contractor. Every person, company, street and record is invented.
// Phones are 555-01XX, emails are @example.com.

import type { ShopSeed } from "@/lib/demo/shop/types";

const REMODEL = [0.6, 0.65, 0.9, 1.25, 1.3, 1.05, 0.85, 0.9, 1.25, 1.35, 1.1, 0.6];
const DECK = [0.2, 0.25, 0.6, 1.3, 1.8, 1.9, 1.6, 1.4, 1.2, 0.9, 0.4, 0.2];
const HVAC = [1.5, 1.35, 0.85, 0.6, 0.75, 1.35, 1.75, 1.55, 0.8, 0.7, 1.05, 1.45];
const WATER = [1.35, 1.25, 1.05, 0.9, 0.85, 0.8, 0.8, 0.85, 0.9, 1, 1.15, 1.3];
const FLAT = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const TUNEUP = [0.3, 0.2, 0.9, 1.6, 1.2, 0.4, 0.2, 0.3, 1.4, 2.6, 2.2, 0.7];

export const act2Seed: ShopSeed = {
  workers: [
    { id: "cole", name: "Cole Brennan", role: "Lead carpenter", crew: "remodel", cost: 42, rate: 85, phone: "(614) 555-0121" },
    { id: "mateo", name: "Mateo Rios", role: "Carpenter", crew: "remodel", cost: 36, rate: 85, phone: "(614) 555-0122" },
    { id: "dana", name: "Dana Whitcomb", role: "Carpenter", crew: "remodel", cost: 34, rate: 85, phone: "(614) 555-0123" },
    { id: "jalen", name: "Jalen Pruitt", role: "Laborer", crew: "remodel", cost: 26, rate: 65, phone: "(614) 555-0124" },
    { id: "rhett", name: "Rhett Sandoval", role: "HVAC lead", crew: "mech", cost: 44, rate: 115, phone: "(614) 555-0125" },
    { id: "tori", name: "Tori Lindqvist", role: "Plumber", crew: "mech", cost: 40, rate: 115, phone: "(614) 555-0126" },
    { id: "wes", name: "Wes Okafor", role: "Service tech", crew: "service", cost: 38, rate: 115, phone: "(614) 555-0127" },
  ],
  crews: [
    { id: "remodel", name: "Remodel crew", color: "#ea8a45", lead: "cole" },
    { id: "mech", name: "Mechanical crew", color: "#72aae8", lead: "rhett" },
    { id: "service", name: "Service", color: "#47b784", lead: "wes" },
  ],
  jobTypes: [
    {
      key: "kitchen", label: "Kitchen remodel", group: "Remodel", crew: "remodel", perYear: 5, price: [42000, 88000], hours: [360, 480], mechHours: [24, 40],
      mat: 0.38, sub: 0.24, season: REMODEL, permits: ["Building", "Plumbing", "Electrical"], big: true,
      titles: ["Kitchen remodel", "Kitchen remodel + island", "Open up galley kitchen"],
      materials: ["Cabinets (semi-custom)", "Sink, faucet + fixtures", "Drywall, trim + paint", "LVP flooring"], subs: ["Electrical", "Countertops", "Tile"],
      labor: ["Demo + haul-away", "Framing + carpentry", "Cabinet install", "Finish carpentry + punch list"],
    },
    {
      key: "bath", label: "Bath remodel", group: "Remodel", crew: "remodel", perYear: 9, price: [16000, 38000], hours: [160, 260], mechHours: [14, 28],
      mat: 0.32, sub: 0.2, season: REMODEL, permits: ["Plumbing"], big: true,
      titles: ["Primary bath remodel", "Hall bath refresh", "Tub-to-shower conversion"],
      materials: ["Vanity + top", "Tile + setting materials", "Shower valve + trim", "Fan, lighting + accessories"], subs: ["Tile", "Electrical"],
      labor: ["Demo", "Framing + backer board", "Finish + fixtures"],
    },
    {
      key: "basement", label: "Basement finish", group: "Remodel", crew: "remodel", perYear: 4, price: [32000, 64000], hours: [320, 440], mechHours: [20, 36],
      mat: 0.3, sub: 0.26, season: REMODEL, permits: ["Building"], big: true,
      titles: ["Basement finish", "Basement finish + bath rough-in"],
      materials: ["Framing lumber + insulation", "Drywall + finishing", "Doors + trim", "LVP flooring"], subs: ["Electrical", "Drywall finishing", "Insulation"],
      labor: ["Framing", "Hang + trim", "Finish carpentry"],
    },
    {
      key: "addition", label: "Addition", group: "Remodel", crew: "remodel", perYear: 1, price: [72000, 90000], hours: [560, 680], mechHours: [40, 60],
      mat: 0.36, sub: 0.3, season: REMODEL, permits: ["Building"], big: true,
      titles: ["Family room addition", "Primary suite addition"],
      materials: ["Framing package", "Windows + exterior door", "Siding + roofing materials", "Interior finishes"], subs: ["Concrete", "Roofing", "Electrical", "Drywall finishing"],
      labor: ["Layout + framing", "Dry-in", "Interior finish"],
    },
    {
      key: "deck", label: "Deck", group: "Remodel", crew: "remodel", perYear: 7, price: [14000, 32000], hours: [100, 170],
      mat: 0.42, sub: 0.08, season: DECK, permits: ["Building"], big: true,
      titles: ["Composite deck", "Pressure-treated deck + stairs", "Deck rebuild"],
      materials: ["Composite decking + fasteners", "PT framing lumber", "Railing system"], subs: ["Concrete"],
      labor: ["Footings + framing", "Decking + railings"],
    },
    {
      key: "hvac-install", label: "HVAC install", group: "Mechanical", crew: "mech", perYear: 16, price: [8200, 17500], hours: [26, 40],
      mat: 0.55, sub: 0.03, season: HVAC, permits: ["Mechanical"], big: false,
      titles: ["Furnace + AC replacement", "Heat pump install", "High-efficiency furnace install"],
      materials: ["Equipment (furnace + condenser)", "Line set, pad + disconnect", "Smart thermostat", "Duct transitions"], subs: ["Electrical"],
      labor: ["Remove + install", "Startup + commissioning"],
    },
    {
      key: "water-heater", label: "Water heater", group: "Mechanical", crew: "mech", perYear: 18, price: [1900, 4600], hours: [5, 8],
      mat: 0.55, sub: 0, season: WATER, permits: ["Plumbing"], big: false,
      titles: ["Water heater replacement", "Tankless water heater install"],
      materials: ["Water heater", "Venting, valves + fittings"], subs: [], labor: ["Remove + install"],
    },
    {
      key: "hvac-repair", label: "HVAC repair", group: "Service", crew: "service", perYear: 45, price: [280, 2400], hours: [2, 6],
      mat: 0.3, sub: 0, season: HVAC, permits: [], big: false,
      titles: ["No-heat call", "AC not cooling", "Blower motor replacement", "Capacitor + contactor", "Furnace tune-up + repair"],
      materials: ["Parts"], subs: [], labor: ["Diagnostic + repair"],
    },
    {
      key: "plumbing-repair", label: "Plumbing repair", group: "Service", crew: "service", perYear: 35, price: [250, 2200], hours: [2, 7],
      mat: 0.28, sub: 0, season: FLAT, permits: [], big: false,
      titles: ["Leak under kitchen sink", "Toilet rebuild", "Sump pump replacement", "Main line clog", "Shutoff valve replacement"],
      materials: ["Parts + fittings"], subs: [], labor: ["Repair"],
    },
    {
      key: "tune-up", label: "HVAC tune-up", group: "Service", crew: "service", perYear: 45, price: [149, 249], hours: [1, 1.5],
      mat: 0.08, sub: 0, season: TUNEUP, permits: [], big: false,
      titles: ["Furnace tune-up", "AC tune-up", "Seasonal maintenance visit"],
      materials: ["Filter + consumables"], subs: [], labor: ["Inspect, clean + test"],
    },
    {
      key: "service", label: "Service call", group: "Service", crew: "service", perYear: 85, price: [250, 950], hours: [1.5, 4],
      mat: 0.2, sub: 0, season: FLAT, permits: [], big: false,
      titles: ["Faucet replacement", "Garbage disposal install", "Door adjust + hardware", "Drywall patch", "Dryer vent cleanout", "GFCI + fixture swap"],
      materials: ["Parts"], subs: [], labor: ["Service labor"],
    },
  ],
  subs: [
    { id: "s1", name: "Brightline Electric", trade: "Electrical", contact: "Gary Holm" },
    { id: "s2", name: "Kessler Electric Co.", trade: "Electrical", contact: "Amy Kessler" },
    { id: "s3", name: "Stonecrest Surfaces", trade: "Countertops", contact: "Ray Duval" },
    { id: "s4", name: "True Line Tile", trade: "Tile", contact: "Nina Ferraro" },
    { id: "s5", name: "Smooth Coat Drywall", trade: "Drywall finishing", contact: "Luis Ortega" },
    { id: "s6", name: "Snug Home Insulation", trade: "Insulation", contact: "Pat Greer" },
    { id: "s7", name: "Rockbed Concrete", trade: "Concrete", contact: "Dale Mercer" },
    { id: "s8", name: "Ridgecap Roofing", trade: "Roofing", contact: "Sean Tully" },
    { id: "s9", name: "Fresh Edge Painting", trade: "Painting", contact: "Kim Albers" },
    { id: "s10", name: "Ground Up Excavating", trade: "Excavation", contact: "Hank Voss" },
  ],
  suppliers: [
    { id: "p1", name: "Northfield Lumber & Supply", kind: "Lumber + building materials" },
    { id: "p2", name: "Allpoint Plumbing Supply", kind: "Plumbing" },
    { id: "p3", name: "Comfort Air Distributors", kind: "HVAC equipment" },
    { id: "p4", name: "Granite Row Tile", kind: "Tile + stone" },
    { id: "p5", name: "Maplecrest Cabinet Co.", kind: "Cabinets" },
    { id: "p6", name: "Ridgeway Hardware", kind: "Hardware + fasteners" },
  ],
  inspectors: [
    { id: "i1", name: "Marcy Oberlin", town: "Westerville" },
    { id: "i2", name: "Ted Kowalczyk", town: "Columbus" },
    { id: "i3", name: "Ana Prieto", town: "Dublin" },
    { id: "i4", name: "Glen Sato", town: "Delaware" },
  ],
  towns: ["Columbus", "Westerville", "Dublin", "Hilliard", "Gahanna", "Grove City", "Delaware", "Pickerington", "Worthington", "Powell"],
  streets: [
    "Larkspur Ln", "Old Mill Rd", "Copper Kettle Dr", "Fox Hollow Ct", "Birchwood Ave", "Quarry Ridge Rd", "Harvest Moon Way", "Tamarack Ct",
    "Sycamore Bend", "Kingfisher Dr", "Lantern Hill Rd", "Wren Hollow Ln", "Stonegate Blvd", "Meadowlark Ct", "Chestnut Grove Dr", "Juniper Way",
    "Ashford Pl", "Pebble Creek Dr", "Silverleaf Ct", "Briar Patch Ln", "Thistle Down Ct", "Granary Rd", "Bluestem Ave", "Cobblers Run",
  ],
  names: {
    first: [
      "Brian", "Melissa", "Jason", "Stephanie", "Chris", "Nicole", "Matt", "Rachel", "Jeff", "Kara", "Doug", "Jenny", "Todd", "Erica", "Greg", "Amber",
      "Scott", "Lindsay", "Kevin", "Holly", "Ben", "Shannon", "Eric", "Carrie", "Mike", "Danielle", "Tom", "April", "Nate", "Laura", "Ray", "Megan",
      "Andre", "Priya", "Luis", "Mei", "Omar", "Keisha", "Raj", "Elena", "Devin", "Tasha", "Hector", "Ingrid", "Sam", "Joanne", "Craig", "Paula",
    ],
    last: [
      "Hartley", "Becker", "Ortiz", "Whitaker", "Lindgren", "Moss", "Caldwell", "Fenton", "Garza", "Hollis", "Ingram", "Jaworski", "Kemp", "Lowry",
      "Monroe", "Nadler", "Osei", "Prescott", "Quinlan", "Raines", "Sutter", "Talbot", "Ulrich", "Vaughn", "Weller", "Yates", "Zimmer", "Ashcroft",
      "Bristow", "Coleman", "Dunphy", "Easton", "Fairfax", "Gallagher", "Hendricks", "Iverson", "Jansen", "Kowal", "Laird", "Mendez", "Novak", "Okoro",
    ],
  },
  companies: {
    pm: ["Keystone Rental Group", "Northpoint Property Co.", "Brickyard Residential", "Maple Row Rentals", "Lantern Property Management", "Summit Ridge Homes Mgmt.", "Oakline Properties"],
    builder: ["Haverford Homes", "Clearwater Builders", "Ridgeview Custom Homes", "Pinecrest Building Co.", "Benchmark Homeworks"],
  },
  markup: { materials: 0.2, subs: 0.15 },
  taxRate: 0.0725,
  sources: [
    { name: "Referral", share: 0.38 },
    { name: "Google", share: 0.27 },
    { name: "Repeat", share: 0.23 },
    { name: "Instagram", share: 0.12 },
  ],
  coIdeas: {
    kitchen: ["Rotted subfloor at sink wall (found at demo)", "Add 4 recessed lights", "Upgrade to soft-close drawer boxes", "Relocate range gas line", "Extend backsplash to ceiling"],
    bath: ["Replace corroded shower valve", "Add niche + bench in shower", "Heated floor mat", "Upgrade exhaust fan to humidity sensing"],
    basement: ["Add egress window", "Wet bar rough-in", "Extra closet under stairs", "Sump relocation"],
    addition: ["Upgrade to vaulted ceiling", "Add exterior outlet + light", "Extra window on east wall"],
    deck: ["Add lighted stair risers", "Upgrade to aluminum balusters", "Extra 4 ft of depth"],
    "hvac-install": ["Replace undersized return duct", "Add whole-home humidifier"],
  },
  callbackIssues: {
    kitchen: ["Drawer front out of alignment", "Slow drain at new sink", "Caulk gap at backsplash"],
    bath: ["Grout crack at shower curb", "Toilet running after install", "Vanity drawer sticking"],
    basement: ["Door rubbing after humidity change", "Nail pops in ceiling drywall"],
    deck: ["Board cupping near steps", "Loose railing post cap"],
    "hvac-install": ["Thermostat not holding schedule", "Condensate line dripping", "Rattle in supply duct"],
    "water-heater": ["Pilot won't stay lit", "Relief valve weeping"],
    addition: ["Exterior trim gap at corner"],
  },
  notes: [
    "Customer works from home; keep noise down 10–11 am calls.",
    "Dog in backyard. Use the side gate.",
    "Lockbox on the garage: code in the job file.",
    "Homeowner picked the matte black fixtures; confirm with supplier.",
    "Park on the street; HOA rules on driveway trailers.",
    "Tenant on site. Call the property manager before arriving.",
    "Measure twice on the island overhang; customer wants 12 in.",
    "Inspector prefers rough-in photos uploaded ahead of visit.",
    "Customer asked for a photo update at end of each day.",
    "Old cast-iron drain is brittle; plan for extra fittings.",
  ],
};
