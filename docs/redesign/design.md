# Design direction

**Mockups:** [`shots/mockup-390.webp`](shots/mockup-390.webp) and [`shots/mockup-1440.webp`](shots/mockup-1440.webp). They cover the hero, The Pile, and the top of One Place, using the real hero art, real tokens and the proposed copy (option ★A throughout). They're static HTML, not the build.

---

## The idea in one line

**The page changes temperature as you scroll, and dither is how it changes.**

The sunset breaks apart into a rigid grid of cold grey pixels when you hit The Pile. It comes back as warm, organic grain when you reach One Place, and by the booking section you're standing in full dusk again. That's the one bold move. Everything around it stays quiet and disciplined, so it lands.

### Why this and not something else
- It's your launch video's story, told by scrolling instead of by a caption.
- It's built from your own material. The hero art is already dithered, so the transitions speak the same pixel language instead of importing a stock effect.
- It gives the site a story it currently lacks. Today, seven sections share one dark treatment ([audit](audit.md#design)).

### What I rejected
- A generic "dark site with glowing accent" pass.
- Swapping the fonts. You told me last time you prefer Instrument Serif, and it's right for this.
- Scroll-jacked, pinned storytelling. It fights phones, it fights your brief, and it costs LCP.

---

## Tokens

**Dusk** (unchanged from `app/globals.css`): `ink #020d02`, `ink-2 #17242d`, `hill #243825`, `dusk #4f4576`, `rose #aa4777`, `coral #fc5f60`, `paper #f2e4dd`, `muted #b7a7a3`.

**Cold** (new, for The Pile only; flat "office fluorescent" grey-blue):

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `cold-bg` | `#dde3ea` | section background | — |
| `cold-surface` | `#eef1f5` | tiles | — |
| `cold-edge` | `#737e8c` | tile borders (control boundary) | ≥3:1 on bg |
| `cold-ink` | `#222a35` | text | 11.2 on bg / 12.8 on tile |
| `cold-muted` | `#4d5866` | secondary text, prices | 5.6 / 6.4 |

**Night** (new, for the way back): `night #12142b`, `violet #231d3f`.
- paper on night: 14.6
- coral on night: 6.0
- muted on night: 7.8

**Rule kept from the audit:** no light text on coral (2.4:1). Coral only carries dark ink text, or appears as text on dark.

## Type
- **Instrument Serif**, now with its italic, is the warm, human voice: H1, every warm-section headline, and the pull quote. Italic is used sparingly for the words that carry the payoff (*yours.*).
- **Geist** (400/500) for body and UI. **In The Pile only, the headline is set in Geist**, flat and sans. The serif is literally missing from the cold world and comes back when warmth does. That's the temperature arc in the typography itself.
- **Geist Mono** (400/500) appears only inside depicted software: tile prices, the pile total, and the mock app's numbers. It's the same family as the body font, so it's cohesive. It is *not* used for section labels anywhere (you didn't like that last time).
- **Scale:**
  - H1 unchanged: `clamp(3rem, 8vw, 7rem)` / 0.95.
  - Section headlines get bigger and more confident: `clamp(2.4rem, 6vw, 5.5rem)`.
  - Body is 17px / 1.6 with a ~34rem measure.
  - `text-wrap: balance` on headlines prevents orphans like "pile." (visible in the phone mockup).

## Wordmark
**"Rose *Revenue*"** in Instrument Serif, roman plus italic, next to a tiny **pixel sun**: a half-disc on the horizon whose reflection breaks into dither. It's a 12×9 inline SVG (well under 1 KB), crisp at any size, and doubles as the favicon motif later if you want.
- *Fallback:* if you'd rather not have a symbol yet, the roman + italic wordmark alone already looks intentional.

---

## The arc, section by section

| # | Section | Temperature | How it's felt |
|---|---|---|---|
| 1 | **Hero** | Dusk | Fixed art (kept). The scrim is stronger at the top, so the text passes AA on phones: subhead **3.5 → 6.5:1**, measured on the mockup. |
| — | edge | → cold | **Bayer-grid dither band.** Its top half is transparent, so as The Pile scrolls up, *your actual sunset* is chopped into a cold pixel grid. A static 300-byte PNG; no JS. |
| 2 | **The Pile** | Cold | Flat grey-blue background, sans headline, clinical tiles, mono prices. No grain overlay here: fluorescent-flat on purpose. |
| — | edge | → night | **Organic noise dither** (random, not grid). Warmth comes back as grain, the texture of the art. 1.2 KB PNG. |
| 3 | **One Place** | Warming | Deep night blue. The serif returns with *yours.* in coral. The mock app **warms as you scroll it into view**: its accents go from grey to coral as it reaches mid-screen (CSS scroll-driven animation; see Motion). |
| 4 | **How it works** | Warming | Night → violet background gradient across the section. Coral numerals (the only real sequence on the page). Ends on the pull quote. |
| 5 | **Also included** | Dusk | Violet → dusk. |
| 6 | **Built in the Midwest** | Full dusk | `section-band.webp` becomes the section's backdrop, not a decoration. The video slot lives here. |
| 7 | **Straight answers** | Full dusk | Dusk-dark with the grain overlay back on. Native `<details>` accordions. |
| 8 | **About** | Full dusk | Photo + short bio (photo TODO). |
| 9 | **Let's talk** | Full dusk | The hero sky returns as the backdrop (same art, cropped to the horizon). **The page ends where it began**, like the video. The Cal embed is unchanged. |

**How it's "felt, not just seen":**
- The bands are ~240px tall, so the color change physically happens under your thumb over a full screen of scrolling.
- The first band cuts through the fixed hero art as it scrolls up, so the sunset itself visibly breaks.
- The mock app's warm-up is tied to scroll position, not to a timer.

---

## Interactive elements

### 1. The Pile calculator (proposed; I think it earns its place)
- **Twelve tiles** are real `<button aria-pressed>` elements. They start **on**, so the number opens at $385/mo and visitors tap away what they don't have.
- **Off state is never color alone:** dashed border, empty checkbox, strikethrough price, and a faint dither fill.
- **Tapping a tile** dissolves it into dither in ~220 ms. The total ticks to its new value over ~300 ms, in an `aria-live="polite"` region.
- **Weight:** ~1 KB of JS in a small client component. No libraries.
- **Accessibility:** 44px+ targets, keyboard toggles with Space/Enter, visible focus ring in `cold-ink`.
- **Phone:** 2 columns. I'll reserve room so long names never collide with the checkbox (visible in the mockup at "Customer tracking").
- **If you'd rather skip it:** it degrades to a static tile grid with the same headline and copy.

### 2. One Place mock app
- **Pure HTML/CSS** (not an image): crisp, a few KB, and readable by screen readers as "illustration, example data".
- **Six module tabs** are a real ARIA tablist (arrow keys work). Each shows a small stylized panel with generic data.
- **Phone:** tabs wrap to rows. No horizontal scrolling anywhere.
- **Motion:** each panel assembles from dither once, the first time it's shown.

### 3. Launch video slot
- **Facade pattern:** the poster image plus a big "Watch the video" button. The `<video>` element (`preload="none"`, `controls`, `playsInline`) only loads **after a tap**. It never autoplays, and sound plays only because the visitor pressed play.
- **Hidden when the file is missing:** the server checks at build time whether `public/video/launch.mp4` exists and renders nothing if not. No broken box, no layout gap.
  - I'll confirm the exact file-check API against the Next 16 docs in `node_modules/next/dist/docs/` before building, per `AGENTS.md`.

### 4. Always-reachable CTA
- **Phone:** a slim bottom bar reading "Book a free call" slides in once the hero CTA scrolls off. It hides again when the booking section is on screen, and respects the iPhone home-bar safe area.
- **Desktop:** the same button appears in the header.
- It's one button, one destination: `#booking`.

---

## Motion plan
**Principle:** motion only where it tells the story. Snappy (150–400 ms). Transform and opacity only, plus one canvas effect.

| What | When | Duration | Reduced motion |
|---|---|---|---|
| **Hero H1** | Never animated: it's the LCP element | — | — |
| Hero kicker, subhead, CTA | Load | 250 ms fade, 40 ms stagger | Instant |
| **Dither dissolve / assemble** (one tiny `<DitherReveal>` canvas component) | Pile tile toggle; One Place panels on first view | 220–400 ms | Instant state change |
| Mock app warm-up (grey → coral accents) | Scroll-linked, CSS `animation-timeline: view()` | Tied to scroll | Shows the warm end state |
| Section headline reveal | First view | 300 ms, 12px rise (was 500 ms / 20 px) | Instant |
| Pile total count | On toggle | 300 ms | Instant |
| Sticky CTA bar | Past the hero | 200 ms slide | Instant |

- **No scroll-jacking, no pinning, no parallax beyond the existing fixed hero.**
- **No layout shift:** everything that animates has reserved space, dither canvases are absolutely positioned overlays, and the Cal slot keeps its fixed min-height.
- Scroll-driven CSS is progressive enhancement. It runs in current Safari and Chrome; browsers without it get the static warm state.
- **No animation libraries.** The dither canvas is ~60 lines using a Bayer threshold, drawn only while animating.

---

## Layout
- **Phone first:**
  - Single column, 20px gutters.
  - Section padding drops from 128px to **80px** (desktop 120px).
  - Target: the page stays about the same length as today (~7,600px) despite adding The Pile, One Place and Midwest, because the dead air goes.
- **Desktop uses the width** (1240px container, up from 1100):
  - Asymmetric 5/7 grids: headline left, working content right (The Pile, How it works).
  - Wide stages for the mock app and the Midwest band.
  - Today, content hugs the left half of the screen.
- **How it works** numerals get a fixed-width column, which fixes the 01 vs 02 misalignment.

## Performance plan (to reach mobile 90+ from 71)
1. **`grain.png` 2.2 MB → ~20 KB:** a 256px grayscale tile, the same look at the size it's actually displayed.
2. **Cal.com mounts when `#booking` is ~1 screen away** (IntersectionObserver). The component, link, namespace and theme config are **byte-for-byte unchanged**. It just stops loading 2 MB and 86 requests for people still reading the hero.
   - This is the one "change" to the booking. It's behavior-preserving, but it's your call. The fallback is leaving it eager and accepting a lower score.
3. **Real `<picture>` art direction** via `getImageProps`, so a phone downloads only `hero-mobile.webp`, with one `priority` preload instead of two.
4. **Fonts:** the Instrument Serif italic plus Geist Mono add ~2 small latin subsets, self-hosted via `next/font`. Only the roman serif and Geist 400 are preloaded.
5. **The new visuals are nearly free:** dither bands are ~1.5 KB total, and the mock app is HTML/CSS. The video costs nothing until tapped.

**Targets:** mobile Performance ≥90, Accessibility ≥95, CLS 0. I'll re-run Lighthouse on the preview and report the numbers.

## Accessibility plan
- Measured contrast for every text/background pair in all three worlds (tables above, plus audit.md). The hero scrim is fixed and verified on real pixels.
- **Structure:**
  - A skip link and one `h1`.
  - An `h2` per section, including a real heading for the pull-quote section.
  - Straight answers moves to `<details>/<summary>`, which also fixes the invalid `<dl>`.
- **Focus:** visible focus rings in every world (coral on dark, `cold-ink` on cold), and keyboard-operable tiles and tabs.
- **Color never carries meaning alone:** check + strikethrough + dashed border mark off tiles.
- Everything respects `prefers-reduced-motion`.

## Metadata and sharing
- New description and OG text per copy.md.
- Fix `metadataBase` so the OG image stops 404ing (needs your canonical-URL answer).
- Keep `og.webp`. *Optional later:* a new OG image showing the sunset breaking into the pile.

## Build, branch and ship
- **Branch:** `redesign/temperature-arc`, off `main`.
- Push it, and Vercel's GitHub integration makes a **preview**. I'll send the link (it's behind your Vercel login).
- **Nothing merges to `main`, and nothing reaches production, without your OK.**
- I won't touch Vercel project settings or DNS.
- **Before ship:**
  - Re-shoot every section at 390 and 1440, then self-review against the brief: message in 5 seconds on a phone, arc felt, contrast, CTA reachable.
  - Lighthouse on the preview, with fixes.
  - A short changelog.
