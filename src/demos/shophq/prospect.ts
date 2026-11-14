// EVERYTHING ABOUT THIS PROSPECT LIVES HERE. Copy this folder to a new slug,
// edit these values, register the slug (see templates/shop-hq/README.md).
// Default prospect: Riverbend Heating & Plumbing is fictional. All records are invented.

import type { ShopProspect } from "../templates/shop-hq/types";

export const prospect: ShopProspect = {
  slug: "shophq",
  name: "Riverbend Heating & Plumbing",
  wordmark: ["Riverbend", "Heating & Plumbing"],
  place: "Columbus, Ohio",
  phone: "(614) 555-0147",
  colors: { accent: "#1d5c8f", ink: "#13212e", second: "#d9531e" },
  towns: ["Westerville", "Dublin", "Hilliard", "Grove City", "Gahanna", "Reynoldsburg", "Worthington", "Upper Arlington", "Pickerington", "New Albany", "Powell", "Canal Winchester"],
  trades: ["HVAC", "Plumbing"],
  services: [
    { name: "No-heat call", trade: "HVAC", kind: "Repair", ticket: [240, 1150] },
    { name: "No-cool call", trade: "HVAC", kind: "Repair", ticket: [240, 1250] },
    { name: "Furnace tune-up", trade: "HVAC", kind: "Tune-up", ticket: [89, 149] },
    { name: "AC tune-up", trade: "HVAC", kind: "Tune-up", ticket: [89, 149] },
    { name: "Furnace replacement", trade: "HVAC", kind: "Install", ticket: [4200, 7800] },
    { name: "AC replacement", trade: "HVAC", kind: "Install", ticket: [4800, 9200] },
    { name: "Thermostat install", trade: "HVAC", kind: "Service", ticket: [240, 520] },
    { name: "Drain clearing", trade: "Plumbing", kind: "Service", ticket: [195, 650] },
    { name: "Water heater replacement", trade: "Plumbing", kind: "Install", ticket: [1600, 3400] },
    { name: "Leak repair", trade: "Plumbing", kind: "Repair", ticket: [220, 1400] },
    { name: "Sump pump replacement", trade: "Plumbing", kind: "Install", ticket: [650, 1400] },
    { name: "Fixture install", trade: "Plumbing", kind: "Service", ticket: [180, 520] },
  ],
  crew: [
    { name: "Marcus Bell", role: "Service tech", trade: "HVAC" },
    { name: "Dana Kowalski", role: "Service tech", trade: "HVAC" },
    { name: "Luis Ortega", role: "Service tech", trade: "HVAC" },
    { name: "Jenna Pratt", role: "Service tech", trade: "HVAC" },
    { name: "Tom Briggs", role: "Plumber", trade: "Plumbing" },
    { name: "Ray Holloway", role: "Plumber", trade: "Plumbing" },
    { name: "Install crew (Wes, Andre, Kyle)", role: "Install crew", trade: "HVAC", install: true },
  ],
  plans: [
    { name: "Comfort Club", price: 179, visits: 2 },
    { name: "Comfort Club Plus", price: 279, visits: 2 },
    { name: "Whole Home", price: 349, visits: 3 },
  ],
  leadSources: [
    { name: "Google", share: 0.42 },
    { name: "Referral", share: 0.2 },
    { name: "Repeat customer", share: 0.28 },
    { name: "Other", share: 0.1 },
  ],
  members: 300,
  connects: "the scheduling, phone and accounting tools you already use",
};
