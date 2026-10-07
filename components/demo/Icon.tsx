import type { IconName } from "@/demos/types";

// Minimal stroke icon set (24px grid). Decorative by default.
const PATHS: Record<IconName, string> = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5",
  users: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8M20 16v-3",
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
  sort: "M8 4v16M8 20l-3-3M8 20l3-3M16 20V4M16 4l-3 3M16 4l3 3",
  box: "M4 8 12 4l8 4v8l-8 4-8-4V8ZM4 8l8 4 8-4M12 12v8",
  truck: "M3 6h11v10H3zM14 9h4l3 3.5V16h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  leaf: "M5 19c0-8 5-14 15-14 0 10-6 15-13 15M5 19l7-7",
  cow: "M6 8 3.5 6M18 8l2.5-2M7 7h10l1 6c0 4-2.5 7-6 7s-6-3-6-7l1-6ZM9.5 16.5h.01M14.5 16.5h.01M9.5 11h.01M14.5 11h.01",
  egg: "M12 3c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.5 8.5 3 12 3Z",
  flask: "M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9",
  chat: "M4 5h16v11H9l-5 4V5ZM8 9.5h8M8 12.5h5",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4",
  drop: "M12 3.5 6.5 11a6.5 6.5 0 1 0 11 0L12 3.5Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  pin: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  move: "M4 12h16M16 8l4 4-4 4M8 8l-4 4 4 4",
  jug: "M9 3h6v3l2.5 3.5V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9.5L9 6V3ZM6.5 13h11",
  cloud: "M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18Z",
  rain: "M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 5.1 4.5 4.5 0 0 0 7 14ZM8 17l-1 3M12 17l-1 3M16 17l-1 3",
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
