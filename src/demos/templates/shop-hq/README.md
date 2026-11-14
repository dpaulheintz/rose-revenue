# Shop HQ: residential HVAC and plumbing template

A phone-first "run the shop" demo for a residential HVAC and/or plumbing company: Today (crews, weather), Calls & Leads, Needs You, Money, Maintenance Plans, Tech Scorecard. Every number opens the list behind it.

The screens live here. Everything about one company lives in that company's `src/demos/<slug>/prospect.ts`, and the data generator reads only that file, so editing it reshapes the whole demo.

## Make a prospect version in under 10 minutes

1. **Copy the folder.** Duplicate `src/demos/shophq/` as `src/demos/<newslug>/` (lowercase, no spaces; it becomes the URL `/demo/<newslug>` and the short link `/<newslug>`).
2. **Edit `prospect.ts`** in the new folder:
   - `slug`: the new slug.
   - `name`, `wordmark`, `place`, `phone`: from their website header and footer.
   - `colors.accent`, `colors.ink` (and `second` for charts): from their logo or website. The accent must be dark enough for white text (4.5:1).
   - `logo` (optional): only if they sent you one. Put it in `public/demos/<newslug>/` and give its path.
   - `towns`: their service area page.
   - `trades`: `["HVAC"]`, `["Plumbing"]` or both.
   - `services`: their services page, with a rough ticket range for each.
   - `crew`: their "meet the team" page, or invent names. Mark the install crew with `install: true`.
   - `plans`: their maintenance plan page (names and yearly prices).
   - `leadSources`, `members`: rough guesses are fine.
   - `connects`: the tools they use, if you know them (e.g. "ServiceTitan and QuickBooks").
3. **Register the slug** in two places:
   - `src/demos/index.ts`: import `config` and `meta` from `./<newslug>/config` and `./<newslug>/meta` (copy the `shophq` lines), and add them to `DEMOS` and `METAS`. The `/<newslug>` short link comes from this automatically.
   - `src/demos/registry.ts`: copy the `shophq` import lines and its `entries` line, renamed.
4. **Check it:** `npx next build`, then open `/demo/<newslug>` at phone width.

Nothing else changes. The OG preview image, noindex and the short link are automatic.

## Files

- `types.ts`: the shape of `prospect.ts`.
- `config.ts`, `meta.ts`, `fonts.ts`: build the demo's config, link preview and fonts from a prospect.
- `data.ts`: the one seeded generator (12 months of jobs, estimates, calls, plan members, permits).
- `derive.ts`: every shared number, so screens agree.
- `client.tsx`, `parts/`, `pages/`: the screens.

All people, customers and records are invented. Phones are 555-01XX and emails are at example.com.
