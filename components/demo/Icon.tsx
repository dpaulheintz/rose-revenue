import type { IconName } from "@/demos/types";

// Minimal stroke icon set (24px grid). Decorative by default.
const PATHS: Record<IconName, string> = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5",
  users: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  gauge: "M4 16a8 8 0 1 1 16 0M12 16l4-5M12 16h.01M7 16h1M16 16h1",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8M20 16v-3",
  ranch: "M3 20V10l9-6 9 6v10M3 20h18M9 20v-6h6v6M12 4v3",
  wrench: "M14.5 6.5a4 4 0 0 0 5 5l-8.8 8.8a2.1 2.1 0 0 1-3-3l8.8-8.8a4 4 0 0 0-2-2ZM16 3.5l-2 3 3.5 3.5 3-2",
  board: "M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  filter: "M4 5h16l-6 8v6l-4-2v-4L4 5Z",
  x: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5 10 17l9-10",
  alert: "M12 8v5M12 16.5h.01M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z",
  calendar: "M4 7h16v13H4zM4 11h16M8 4v4M16 4v4",
  phone: "M6.5 4h3l1.5 4-2 1.2a11 11 0 0 0 5.8 5.8L16 13l4 1.5v3A2.5 2.5 0 0 1 17.5 20 14 14 0 0 1 4 6.5 2.5 2.5 0 0 1 6.5 4Z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  arrow: "M5 12h14M13 6l6 6-6 6",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
  columns: "M4 5h5v14H4zM10.5 5h5v14h-5zM17 5h3v14h-3z",
  camera: "M4 8h3l2-2.5h6L17 8h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  sort: "M8 4v16M8 20l-3-3M8 20l3-3M16 20V4M16 4l-3 3M16 4l3 3",
  music: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
};

export default function Icon({ name, size = 20, className = "", label }: { name: IconName; size?: number; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" || name === "grip" ? 3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
