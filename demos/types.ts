// Shared shape of a prospect demo (/demo/[slug]). The shell, ribbon, toast,
// nav and theming read only this; each demo adds its own seed data next to
// its config and its own modules.

export type IconName =
  | "home" | "users" | "chart" | "wrench" | "board" | "more" | "search" | "filter" | "x"
  | "plus" | "check" | "alert" | "calendar" | "phone" | "mail" | "grip" | "arrow" | "table"
  | "columns" | "sort" | "box" | "truck" | "leaf" | "cow" | "egg" | "flask" | "chat" | "sun"
  | "drop" | "clock" | "pin" | "spark" | "move" | "cloud" | "rain" | "jug"
  | "hammer" | "dollar" | "camera" | "shield" | "clipboard" | "pen" | "moon" | "eye" | "receipt" | "play" | "stop" | "image";

export type Theme = {
  bg: string; // app background
  panel: string; // cards
  panel2: string; // raised / hover / inset
  line: string; // hairlines
  text: string;
  muted: string;
  accent: string; // brand accent (buttons, active nav)
  onAccent: string; // text on accent
  header: string; // header background
  onHeader: string; // header text
  good: string;
  bad: string;
  warn: string;
  info: string;
  chart: string[]; // categorical series colors
};

export type DemoModule = {
  key: string;
  label: string;
  short?: string; // phone tab label
  icon: IconName;
  path: string; // "" = demo home
  phone?: boolean; // one of the four phone tabs (the rest live under More)
  blurb?: string; // one line for the Overview's module index
};

/** Per-demo typography/shape knobs. Defaults reproduce the original demo look. */
export type Look = {
  themeColor: string; // browser chrome color
  displayWeight?: number;
  displayTracking?: string;
  wordmarkWeight?: number;
  wordmarkTracking?: string;
  radius?: string; // card corner radius
  shadow?: string; // card shadow
  fonts?: "farm" | "shop"; // which loaded font set the demo uses
};

export type DemoConfig = {
  kind: "farm" | "shop";
  slug: string;
  seed: number;
  timeZone: string;
  company: {
    name: string;
    wordmark: [string, string]; // two-line typeset wordmark
    appName: string; // shown in the header
    place: string;
  };
  theme: Theme; // default theme
  lightTheme?: Theme; // when present, the header offers a light/dark toggle (theme above = dark)
  look?: Look;
  brand?: { logo?: string; logoAlt?: string };
  copy: {
    ribbon: string;
    toast: string;
    footer: string;
  };
  modules: DemoModule[];
};
