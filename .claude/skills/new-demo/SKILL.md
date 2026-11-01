---
name: new-demo
description: Add a prospect demo at /demo/<slug> (short link /<slug>) to the Rose Revenue site, built from the parts bin in src/demos/kit. Use when asked to build a demo, concept app or "run the whole business" mockup for a prospect.
---

# Add a prospect demo

A demo is a click-through app with fake data that makes one owner say "can you build this for us?" and book a call. The kit is a parts bin, not a template: every demo gets its own layout, screens and personality. Nothing requires an Overview page, a weather strip or any fixed screen.

## 1. Read the request
Pin down: the business and what they do, their colors and fonts (read them from their site's CSS; never copy logos or photos unless Paul supplies one), the screens asked for, and the one "wow" screen. Spend your design effort there.

## 2. Create src/demos/<slug>/
Copy the shape of `src/demos/buckeye` (newest) or `act2`:

| File | What goes in it |
|---|---|
| `config.ts` | name, wordmark or logo path, theme (add `lightTheme` for a toggle), `look`, nav items in order (`modules`; the first is where `/demo/<slug>` lands; `phone: true` on four for the tab bar), ribbon, toast, footer, vocabulary |
| `data.ts` | that demo's seeded data, built with the kit helpers |
| `meta.ts` | page title, description, and the `og` card: headline, sub, colors, logo or generic mark, font |
| `fonts.ts` | `next/font/google` with `preload: false`, `display: "swap"`; export `fontClass` and `fontVars` |
| `pages/` | that demo's screens, composed from kit parts plus anything custom |
| `pages/index.tsx` | lazy loader: literal `dynamic(() => import("./X"))` per screen and the provider (exports `Data`, `Screen`). Copy an existing one; literal imports are what make code splitting and SSR work |
| `parts/` | the demo's provider (state in React memory only) and custom components |

Reuse kit parts when they fit. Build custom pieces when the business needs something the kit doesn't have. If you build something reusable, move it into the kit and add it to the list below.

## 3. Budget
Default: up to 5 screens, about 20-40 records per list, no more than ~12 months of history. (A request can ask for more.) Keep data believable and consistent across screens: compute shared numbers in one selector so two screens can't disagree. Don't over-engineer reconciliation.

## 4. Copy
Short, plain language, written for the owner, not tech people. All names fictional: no real people, customers, businesses or addresses. Phones 555-01XX, emails at example.com. The ribbon and Book-a-call button are always present (the shell renders them).

## 5. Register
- `src/demos/index.ts`: add the config to `DEMOS` and the meta to `METAS`. The `/<slug>` short link (308) comes from this automatically, via `next.config.ts`.
- `src/demos/registry.ts`: add one `entries` line (fonts, `Data`, `Screen`).
- Routes, noindex/nofollow, robots `Disallow: /demo`, and the 1200x630 OG image (`app/demo/[slug]/opengraph-image.tsx`) are automatic. Don't add route folders.

## 6. Verify
- `npm run build` passes (`next build`); `npx eslint src app` is clean.
- No console errors; no network requests except same-origin (fonts are self-hosted).
- Screenshots at 390px only (headless Playwright installed in the scratchpad): 48px tap targets, no page-level sideways scroll.
- `/<slug>` returns 308 to `/demo/<slug>`; `/demo/<slug>/opengraph-image` renders; `noindex` is in the page.
- `/demo/sweetgrass` and `/demo/act2` still work.

## 7. Do not push or deploy
Pushing `main` auto-deploys the live site. Report what was built and the local URL, and wait for Paul.

## The kit (src/demos/kit)
Import with the `@demos/` alias. Everything is prop-driven with no business copy.

**Shell (automatic, from the layout):** `shell/DemoShell` (header, sidebar, phone tab bar, ribbon, footer), `shell/DemoProvider` (`useDemo()`: `cfg`, `anchor`, `base`, `notify()` for the demo-mode toast, theme mode), `shell/BookCall`, `shell/Brand` (`Wordmark`, `PreparedBy`, `GenericMark`; `brand.preparedBy: false` makes it read as their own system). Styles: `kit.css`.

**UI (`ui/`):** `ui.tsx` has `Stat` (KPI card), `Pill` (status chip), `Card`, `PageHeader`, `Button`, `Segmented`, `Field`, `FilterChip`, `Tabs`, `Note`, `Avatar`, `Chip`, `EarTag`. Also `Dialog` (modal; `drawer` = record drawer/bottom sheet), `Icon`, `SearchBar`, `EmptyState`, `Kanban` (touch drag), `charts` (`ColumnChart`, `LineChart`, `Donut`, `BarList`, `SplitBar`, `Sparkline`; plain divs and SVG with no library, so there's nothing to lazy-load).

**Optional blocks (`blocks/`):** `ResponsiveTable` (table, cards on phones), `ListWithDetail` (search + chips + table + drawer: the CRM screen), `Calendar` (`AgendaList`, `WeekGrid` with drag, `MonthGrid`), `DocumentPaper` (invoice/quote on printable white paper), `SignaturePad`, `PhotoTile` (placeholder photos), `PhoneFrame`, `QuickAdd` (floating +), `AskBox` (chat box with canned answers), `Tour` (guided tour).

**Data helpers (`data/`):** `rng` (`makeRng`, `hash`: seed from the slug, one stream per concern), `dates` (`todayIn` runs once in the layout; read it as `anchor` from `useDemo()` and rebuild data from it so server and client match), `fake` (`peopleNames`, `phone555`, `emailFor`, `streetAddress`), `format` (`usd`, `money`, `shortDate`, `dayDate`, `count`...), `season` (`seasonCurve`, `seasonOf`).

## Gotchas
- This repo's Next.js has breaking changes: check `node_modules/next/dist/docs` before using an API.
- Grid lists need `*:min-w-0` or long text pushes the page sideways on phones.
- Don't read the clock in render (hydration mismatch, and React Compiler lint errors): use `anchor`, or set time in an effect.
- Before touching kit code that other demos use, screenshot their pages and pixel-diff afterward.
