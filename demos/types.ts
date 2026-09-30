// Types for prospect demos (/demo/[slug]). A demo is one config file plus
// seed pools; every module renders from the dataset generated from it.

export type ModuleKey = "overview" | "crm" | "kpis" | "sales" | "ranch" | "maintenance" | "projects";

export type IconName =
  | "home" | "users" | "gauge" | "chart" | "ranch" | "wrench" | "board" | "more"
  | "search" | "filter" | "x" | "plus" | "check" | "alert" | "calendar" | "phone"
  | "mail" | "grip" | "arrow" | "table" | "columns" | "camera" | "sort" | "music";

export type USState = "TX" | "AR" | "LA" | "FL";

export type Theme = {
  bg: string; // app background
  panel: string; // cards
  panel2: string; // raised / hover
  line: string; // hairlines
  text: string;
  muted: string;
  accent: string; // brand accent (buttons, active nav)
  onAccent: string; // text on accent
  good: string;
  bad: string;
  warn: string;
  steel: [string, string]; // brushed-steel header gradient stops
};

export type Person = { id: string; name: string; role: string };

export type Market = {
  id: string;
  name: string;
  state: USState;
  areaCode: string;
  cities: string[];
  accounts: number; // how many accounts to generate here
  repId: string;
};

export type Sku = {
  id: string;
  name: string;
  kind: string; // e.g. "Butterscotch-pepper whiskey"
  casePrice: number; // wholesale, per 9-liter case
  bottlePrice: number; // bottle-shop shelf price
  weight: number; // relative popularity with distributors
  season: "cold" | "warm" | "flat";
  channel: "all" | "limited" | "ranch"; // limited = bottle shop + a few package stores
};

export type AccountType = "Bar" | "Restaurant" | "Package store" | "Regional grocery" | "Venue" | "Hotel";

export type ProjectStatus = "Not started" | "Working on it" | "Stuck" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export type ProjectBoardSeed = {
  id: string;
  name: string;
  anchor?: { month: number; day: number }; // board revolves around next occurrence of this date
  items: Array<{
    name: string;
    owner: string; // person id
    group: "This week" | "Up next" | "Done";
    status: ProjectStatus;
    priority: Priority;
    start: number; // days relative to today (or anchor)
    due: number;
  }>;
};

export type MaintenanceSeed = {
  title: string;
  equipment: string;
  location: string;
  priority: Priority;
};

export type KpiKey =
  | "txCases" | "oosCases" | "newAccounts" | "visits" | "tastings" | "bottleShop"
  | "ranchCocktails" | "ranchFoodCigar" | "privateEvents" | "newsletter" | "production" | "openMaintenance";

export type KpiDef = {
  key: KpiKey;
  name: string;
  owner: string; // person id
  direction: "atLeast" | "atMost";
  unit: "count" | "money" | "cases";
};

export type DemoConfig = {
  slug: string;
  seed: number;
  timeZone: string;
  company: {
    name: string;
    wordmark: [string, string]; // e.g. ["IRON WOLF", "RANCH & DISTILLERY"]
    appName: string; // shown in the header, e.g. "Pack HQ"
    place: string;
    teamName: string;
  };
  theme: Theme;
  copy: {
    ribbon: string;
    banner: string;
    closing: { title: string; paragraphs: string[] };
  };
  modules: Array<{ key: ModuleKey; label: string; icon: IconName; path: string }>;
  people: Person[];
  reps: Person[];
  markets: Market[];
  skus: Sku[];
  accountTypes: Array<{ type: AccountType; share: number; size: number; skus: string[] }>;
  sales: {
    monthlyCasesBase: number;
    seasonIndex: number[]; // Jan..Dec
    txShare: number;
    growthPerMonth: number;
  };
  ranch: {
    openHours: { fri: number[]; sat: number[] }; // hours of day open
    stages: string[];
    houseTruck: string;
    guestTrucks: string[];
    acts: string[];
    cocktails: Array<{ name: string; price: number; weight: number }>;
    eventTypes: Array<{ type: string; guests: [number, number]; price: [number, number] }>;
    eventHosts: string[];
    visitorSeason: number[]; // Jan..Dec
  };
  kpis: KpiDef[];
  maintenance: { locations: string[]; items: MaintenanceSeed[] };
  projects: ProjectBoardSeed[];
  names: {
    first: string[];
    last: string[];
    venueStems: string[];
    suffixes: Record<AccountType, string[]>;
  };
};
