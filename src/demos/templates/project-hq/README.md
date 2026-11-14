# Project HQ: commercial contractor template

A desktop-first decision screen for a commercial mechanical, plumbing or electrical contractor: Owner Dashboard (with a computed "Needs attention" list), Projects (sortable, with a job-cost panel), Change Orders, Billing, Labor & Manpower, Service Contracts. Every number opens the list behind it. On a phone, tables become cards and panels become bottom sheets.

The screens live here. Everything about one company lives in that company's `src/demos/<slug>/prospect.ts`, and the data generator reads only that file, so editing it reshapes the whole demo.

## Make a prospect version in under 10 minutes

1. **Copy the folder.** Duplicate `src/demos/projecthq/` as `src/demos/<newslug>/` (lowercase, no spaces; it becomes the URL `/demo/<newslug>` and the short link `/<newslug>`).
2. **Edit `prospect.ts`** in the new folder:
   - `slug`: the new slug.
   - `name`, `wordmark`, `place`, `phone`: from their website header and footer.
   - `colors.accent`, `colors.ink` (and `second` for charts): from their logo or website. The accent must be dark enough for white text (4.5:1).
   - `logo` (optional): only if they sent you one. Put it in `public/demos/<newslug>/`.
   - `trade`: Mechanical, Plumbing or Electrical.
   - `projectTypes`: the markets on their projects or portfolio page, with rough shares.
   - `pms`: their project managers (team page), or invented names.
   - `gcs`: invent general contractor names. Never use real companies.
   - `contractRange`, `activeProjects`: their typical job size and how many run at once.
   - `laborRate`: a blended field labor cost per hour (a rough guess is fine).
   - `crews`: their crew types and headcount (about 60 in all is a good default).
   - `serviceAgreements`: roughly how many maintenance agreements they hold.
   - `connects`: the tools they use, if you know them (e.g. "Viewpoint and Procore").
3. **Register the slug** in two places:
   - `src/demos/index.ts`: import `config` and `meta` from `./<newslug>/config` and `./<newslug>/meta` (copy the `projecthq` lines), and add them to `DEMOS` and `METAS`. The `/<newslug>` short link comes from this automatically.
   - `src/demos/registry.ts`: copy the `projecthq` import lines and its `entries` line, renamed.
4. **Check it:** `npx next build`, then open `/demo/<newslug>` at desktop width and on a phone.

Nothing else changes. The OG preview image, noindex and the short link are automatic. Project names come from descriptive pools in `data.ts` by project type (e.g. "Northfield Medical Pavilion, Phase 2"); they are never real buildings.

## Files

- `types.ts`: the shape of `prospect.ts`.
- `config.ts`, `meta.ts`, `fonts.ts`: build the demo's config, link preview and fonts from a prospect.
- `data.ts`: the one seeded generator (projects, change orders, pay apps, workers, forecast, service agreements and calls).
- `derive.ts`: every shared number and the "Needs attention" list, so screens agree.
- `client.tsx`, `parts/`, `pages/`: the screens.

All people, buildings, companies and records are invented. Phones are 555-01XX.
