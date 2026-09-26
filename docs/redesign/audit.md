# Audit — current site (commit `ad2be25`)

**Method.** I built the site for production and served it locally on :3100. Playwright 1.63 took section-by-section screenshots at **390×844 (@2x)** and **1440×900**, with reduced motion on so the scroll reveals render. Lighthouse 13 ran with simulated mobile throttling against production at `rose-revenue-site.vercel.app`. WCAG contrast is computed from the design tokens and from the rendered hero pixels. Screenshots are in [`shots/`](shots/), named `current-<width>-<order>-<section>.webp`.

---

## Read this first: three things outside the page itself

1. **The metadata pointed at a domain that isn't yours** (the unhyphenated spelling, which belongs to someone else). *Resolved:* your domain is **rose-revenue.com**. It already points at this Vercel project, and every reference now uses `https://rose-revenue.com`. See [domain.md](domain.md).
2. **Link previews were broken.** `metadataBase` used that wrong domain, so `og:image` resolved to a URL that **404s**, and texted links showed no preview image. *Fixed on the redesign branch* (live once it merges). `https://rose-revenue.com/og.webp` already serves the image.
3. **Vercel and local setup.**
   - GitHub has two production deployment records for `ad2be25`: "Production – rose-revenue-site" and a plain "Production". That suggests two Vercel projects are connected to this repo, possibly the one that 404'd before. A branch push may create two previews, so it's worth disconnecting the stale one in Vercel (I won't touch project settings).
   - Deployment URLs sit behind Vercel's login (Deployment Protection). Preview links will open for you when you're signed in, but not for someone you text.
   - Locally, the `git` at `/usr/local/bin/git` is an Intel-only build that no longer runs on this Mac ("Bad CPU type"). `/usr/bin/git` works, so I'm using that. Port 3000 belongs to your *Big Al* project, so I moved this site's dev server to **3101** and added a production-preview entry on **3100** in `.claude/launch.json`.

---

## Scorecard (production, Lighthouse)

| | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| **Mobile** | **71** | 92 | 77 | 100 |
| Desktop | 100 | 92 | 77 | 100 |

**Mobile metrics:**
- Simulated LCP is **17.1 s**. On a fast connection the observed LCP is ~0.9 s.
- CLS is 0 and TBT is 10 ms.
- The page weighs **4.5 MB** before anyone scrolls.

The LCP element is the H1 text. It isn't slow in itself: it's queued behind everything below.

**Brief targets:** mobile performance 90+ and accessibility 95+. Both are currently missed.

---

## What's working (keep it)

- **The hero is the brand.** The dithered dusk art under an Instrument Serif H1 is genuinely distinctive and nothing like a template.
  - The headline sits in open sky, and on a phone the CTA is above the fold ([390 hero](shots/current-390-01-we-build-the-tools-your-busi.webp)).
- **Palette.** Every token is sampled from the art, with no pure black or white. That's worth keeping exactly.
- **Voice.** The copy uses short, plain sentences. "No consultants in suits", "not a subscription you'll use 10% of", "You own it" and the pull quote are keepers.
- **The Cal.com embed** is themed dark and coral and books cleanly on a phone ([390 booking](shots/current-390-09-lets-talk.webp)). I'll preserve it exactly.
- **Engineering hygiene.** Zero layout shift, almost no main-thread JS, reduced motion respected, and a mostly semantic structure.

## What's weak

### Message (the biggest problem)
- **It leads with AI.** AI is the hero subhead's first idea, the first pillar ("Teach you AI for real"), the meta description and the OG text. On a phone, the 5-second read is *"another AI consultant."*
- **The new positioning isn't on the page at all:**
  - CRM, dashboard, logs, projects, scorecards: none of these appear.
  - "Silicon Valley" as the enemy: absent.
  - "Midwest": absent. Columbus only shows up in About and the footer.
  - Ownership doesn't appear until step 04.
- **There's nothing to picture.** The four 80px thumbnails ([390](shots/current-390-02-what-we-do.webp)) don't show what you build. A skeptical owner can't imagine the product.
- **It says "we" throughout.** The brief wants "I".

### Design
- **Everything after the hero looks the same.** Seven sections in a row share one treatment: a small serif H2, a left column and dark ink. There's no crescendo and no story ([1440 full page](shots/current-1440-00-fullpage.webp)).
- **Desktop wastes half the width.** Content hugs the left ~700px of a 1440px screen.
- **No temperature.** One dark background runs from hero to footer. The dusk band is the only color moment, and it's decorative rather than narrative.
- **The page is long on a phone, with dead air.** It's **7,653px** tall at 390, and every section has 128px of top and bottom padding. "What we do" alone is ~1,400px for four items.
- **The CTA appears twice, 7,000px apart.** It's in the hero and at the very bottom, with nothing in between and no persistent affordance.
- **The wordmark is just the heading font at 24px.** It doesn't read as a mark.
- **Small bug:** in How it works, "01" is narrower than 02–04, so the step titles don't line up ([390](shots/current-390-04-how-it-works.webp)).

### Performance (why mobile scores 71)
| Cause | Cost | Fix |
|---|---|---|
| `grain.png` is a 1024×1024 RGB PNG displayed as a 180px tile | **2.2 MB**, half the page | Grayscale tile at display size: ~15–30 KB, same look |
| The Cal.com embed mounts on page load | **86 requests / ~2 MB** before any scroll. It also causes the third-party-cookie flag (Best practices 77). | Mount it when the booking section nears the viewport. The embed and its config stay identical. |
| Both hero images download on a phone (`display:none` still fetches) | ~20 KB, plus two `priority` preloads competing | A real `<picture>` art-direction so only one is fetched |

### Accessibility (92)
- **Hero subhead contrast fails on phones.** The lower lines sit on the brightest coral sky at **3.5–3.7:1**; body text needs 4.5:1.
- **H1 contrast, large text.** The median is 4.2:1, which passes the 3:1 large-text minimum. The worst pixels behind "existed." are 2.4:1, so the scrim needs to be slightly stronger in that band.
- **Invalid definition list.** In Straight answers, `<dl>` children are wrapped in two layers of `<div>` by the reveal wrapper. Lighthouse flags this; it's a real screen-reader issue.
- No skip link. A focus style is defined only on the CTA.
- The pull-quote section has no real heading (an `sr-only <p>`).

### Token contrast (WCAG ratios; AA is 4.5 for body text and 3.0 for large text)
| Pair | Ratio | |
|---|---|---|
| paper on ink | 15.9 | ✓ |
| muted on ink | 8.6 | ✓ |
| coral on ink | 6.6 | ✓ |
| ink on coral (CTA) | 6.6 | ✓ |
| **paper on coral** | **2.4** | ✗ Never put light text on coral |
| paper on rose | 4.4 | large text only |
| dusk on ink | 2.3 | decorative only |
| hill on ink | 1.6 | hairlines only |

---

## Current brand tokens and fonts (from the code)

**Colors** (`app/globals.css` `@theme`; all sampled from `hero.webp`):

| Token | Hex | Role today |
|---|---|---|
| `ink` | `#020d02` | Page background (darkest foreground grass) |
| `ink-2` | `#17242d` | Raised surface (Cal frame) |
| `hill` | `#243825` | Hairlines |
| `dusk` | `#4f4576` | Mountain purple, mostly unused |
| `rose` | `#aa4777` | Upper sky, unused |
| `coral` | `#fc5f60` | The one accent: CTA, list dots, numerals, pull quote |
| `paper` | `#f2e4dd` | Text (sunlit path) |
| `muted` | `#b7a7a3` | Secondary text |

**Fonts** (`next/font/google`, `app/layout.tsx`):
- **Instrument Serif 400** for display: H1 `clamp(3rem, 8vw, 7rem)` / 0.95 / -0.02em, and H2 `clamp(2rem, 4.5vw, 3.25rem)`.
- **Geist 400** for body text.
- **Texture:** `grain.png` as a fixed full-page overlay at 5%.
- **Motion:** a 500ms fade-and-rise reveal via IntersectionObserver, a fixed-hero parallax, and reduced motion respected.

**Images in `/public`:**

| File | Size |
|---|---|
| `hero.webp` | 183 KB |
| `hero-mobile.webp` | 52 KB |
| `section-band.webp` | 240 KB |
| `og.webp` (1200×632) | 71 KB |
| `pillar-1–4.webp` | 3–8 KB each |
| `grain.png` | **2.3 MB** |

`public/video/` does not exist yet.
