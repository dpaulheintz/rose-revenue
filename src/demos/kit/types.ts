// Shared shape of a prospect demo (/demo/[slug]). The shell, ribbon, toast,
// nav and theming read only this; each demo adds its own seed data next to
// its config and its own modules.

export type IconName =
  | "home" | "users" | "chart" | "wrench" | "board" | "more" | "search" | "filter" | "x"
  | "plus" | "check" | "alert" | "calendar" | "phone" | "mail" | "grip" | "arrow" | "table"
  | "columns" | "sort" | "box" | "truck" | "leaf" | "cow" | "egg" | "flask" | "chat" | "sun"
  | "drop" | "clock" | "pin" | "spark" | "move" | "cloud" | "rain" | "jug"
  | "hammer" | "dollar" | "camera" | "shield" | "clipboard" | "pen" | "moon" | "eye" | "receipt" | "play" | "stop" | "image";

export type MarkName = "grass" | "mountain" | "gear";

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

/** A lane groups modules into one part of the business (e.g. Brands | Co-Packing | Company). */
export type DemoLane = { key: string; label: string; color?: string; onColor?: string };

export type DemoModule = {
  key: string;
  lane?: string; // DemoLane.key, for demos with lanes
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
  bodySize?: string; // base text size (default 15px); phone-first demos use 16px so inputs don't zoom
  viewportFit?: "cover"; // draw under the notch / home bar (the shell then pads for safe areas)
};

/** Link-preview + page metadata for a demo. The OG card is drawn from these brand colors. */
export type DemoMeta = {
  title: string;
  description: string;
  og: {
    headline: string; // big line on the preview card
    sub: string; // one sentence under it
    bg: string;
    fg: string;
    accent: string;
    logo?: string; // public path (PNG) drawn on the card, e.g. the prospect's logo
    mark?: MarkName; // generic mark when there's no logo
    font?: { family: string; weight: number }; // Google font for the card's headline
    noMark?: boolean; // no logo and no generic mark: the typeset name alone
  };
  app?: { name: string; icon: string }; // add-to-home-screen name and icon (public path, 180x180 PNG)
};

export type DemoConfig = {
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
  brand?: { logo?: string; logoAlt?: string; mark?: MarkName; markColor?: string; preparedBy?: boolean; typeOnly?: boolean }; // typeOnly: a typeset wordmark with no mark
  copy: {
    ribbon: string;
    toast: string;
    footer: string;
  };
  modules: DemoModule[]; // nav items, in order; the first is where /demo/<slug> lands
  lanes?: DemoLane[]; // optional: split the app into lanes (use shell/LaneShell)
  vocab?: Record<string, string>; // this business's words for things (e.g. { customer: "owner" })
};
