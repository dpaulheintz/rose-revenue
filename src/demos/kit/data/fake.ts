// Fake-but-believable people and places. Phones are always 555-01XX and emails
// always example.com, so nothing here can reach a real person.

import type { Rng } from "./rng";

export const FIRST_NAMES = [
  "Alicia", "Ben", "Carla", "Dale", "Erin", "Frank", "Gina", "Hank", "Iris", "Joel", "Kara", "Luis", "Mona", "Nate", "Olive", "Pete", "Quinn", "Rita", "Sean", "Tina",
  "Uma", "Vince", "Wendy", "Xavier", "Yara", "Zane", "Amir", "Bea", "Cole", "Dina", "Eli", "Fay", "Grant", "Hope", "Ivan", "Jill", "Kurt", "Lena", "Marcus", "Nora",
];
export const LAST_NAMES = [
  "Adair", "Bowen", "Crane", "Dolan", "Elder", "Foley", "Gentry", "Holt", "Irwin", "Judd", "Keane", "Lawton", "Mercer", "Nolan", "Oakley", "Paige", "Reeves", "Sayer",
  "Tolliver", "Upshaw", "Vickers", "Wren", "Yost", "Ziegler", "Abbott", "Barlow", "Cobb", "Drake", "Ewing", "Fitch", "Gage", "Hale", "Ives", "Joyner", "Kirby", "Lott",
];
export const STREETS = ["Larkspur Ln", "Old Mill Rd", "Fox Hollow Ct", "Birchwood Ave", "Quarry Ridge Rd", "Tamarack Ct", "Kingfisher Dr", "Stonegate Blvd", "Juniper Way", "Ashford Pl", "Pebble Creek Dr", "Bluestem Ave"];

/** Unique full names (reshuffles the pools until it has enough). */
export function peopleNames(rng: Rng, n: number, first = FIRST_NAMES, last = LAST_NAMES) {
  const seen = new Set<string>();
  while (seen.size < Math.min(n, first.length * last.length)) seen.add(`${rng.pick(first)} ${rng.pick(last)}`);
  return [...seen];
}
export const phone555 = (rng: Rng, area = "614") => `(${area}) 555-01${String(rng.int(0, 99)).padStart(2, "0")}`;
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, "").trim();
/** first.last@example.com, or first@company.example.com. */
export const emailFor = (name: string, company?: string) => (company ? `${slug(name).split(" ")[0]}@${slug(company).replace(/ /g, "")}.example.com` : `${slug(name).replace(/ /g, ".")}@example.com`);
export const streetAddress = (rng: Rng, streets = STREETS) => `${rng.int(2, 98) * 10 + rng.int(0, 9)} ${rng.pick(streets)}`;
