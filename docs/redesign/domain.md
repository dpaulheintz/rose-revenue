# rose-revenue.com: domain setup

*Checked live on 2026-09-25 with `dig` and `curl`.*

## Where things stand

The domain already works. Only one setting is missing.

| Check | Result |
|---|---|
| Nameservers | Cloudflare (`liz.ns.cloudflare.com`, `moura.ns.cloudflare.com`) ✓ |
| `rose-revenue.com` | A records → `216.150.1.193`, `216.150.16.193` (Vercel). Serves this site over valid HTTPS ✓ |
| `http://` → `https://` | 308 redirect ✓ |
| `www.rose-revenue.com` | CNAME → `7b3ffe1894c9ff22.vercel-dns-016.com` (Vercel). **Serves the site directly instead of redirecting** ✗ |
| Cloudflare proxy | Off. Responses come straight from Vercel (`server: Vercel`, no Cloudflare headers) ✓ |
| CAA records | None, so nothing blocks Vercel's certificate ✓ |
| `https://rose-revenue.com/og.webp` | 200, image/webp ✓ |

## Step 1 — Vercel: redirect www to the bare domain

1. Go to vercel.com and open team **pauls-projects** → project **rose-revenue-site** → **Settings → Domains**.
2. Find **rose-revenue.com**. It should say **Valid Configuration**, be connected to **Production**, and have *no* redirect. Leave it as is.
3. Find **www.rose-revenue.com** and click **Edit**.
   - Set **Redirect to** `rose-revenue.com`.
   - Set **Status code** to **308 Permanent Redirect**, then save.
   - *If www isn't listed:* click **Add Domain**, enter `www.rose-revenue.com`, and choose **Redirect to rose-revenue.com (308)**.
4. Don't change anything else, in particular the **Framework Preset** or build settings.

## Step 2 — Cloudflare: nothing to change, just verify

In Cloudflare, open **rose-revenue.com → DNS → Records**. You should see exactly this for `@` and `www`:

| Type | Name | Content | Proxy status |
|---|---|---|---|
| A | `@` | `216.150.1.193` | **DNS only** (grey cloud) |
| A | `@` | `216.150.16.193` | **DNS only** (grey cloud) |
| CNAME | `www` | `7b3ffe1894c9ff22.vercel-dns-016.com` | **DNS only** (grey cloud) |

- **If Vercel's Domains page shows different values, use Vercel's.** It's the source of truth, and it can hand out project-specific records.
- **Delete** any *other* A, AAAA or CNAME records for `@` or `www` that point somewhere else. There are none today.

### Why "DNS only" (grey cloud), not proxied (orange)
- **SSL:** Vercel issues and renews your HTTPS certificate itself. With the orange cloud on, Cloudflare sits in front and can block those renewals, so the certificate eventually expires. Combined with Cloudflare's "Flexible" SSL mode, it can also cause endless redirect loops.
- **Speed:** Vercel is already a global CDN. Proxying through Cloudflare adds a second cache layer and makes problems harder to debug.

Vercel's own guidance is to leave these records unproxied.

If you ever add **CAA** records, include `letsencrypt.org`, or Vercel can't issue certificates.

## Step 3 — Confirm

Once Step 1 is saved:

```bash
curl -sI https://www.rose-revenue.com | grep -iE "^HTTP|^location"
```

Expect `HTTP/2 308` and `location: https://rose-revenue.com/`.

When the redesign merges to production, I'll confirm `og:image` reads `https://rose-revenue.com/og.webp` and loads, so texted links show the preview image.

---

## Vercel projects: which one to disconnect

**Probably none.** GitHub shows two production deployment records for commit `ad2be25`, but both belong to the same project:

| GitHub environment label | Created (UTC) | Deployment URL |
|---|---|---|
| Production | Aug 6, 01:45 | `rose-revenue-site-gka99oup8-pauls-projects-50a28006.vercel.app` |
| Production – rose-revenue-site | Aug 6, 01:59 | `rose-revenue-site-nyal1flor-pauls-projects-50a28006.vercel.app` |

Vercel deployment URLs start with the project name, and both start with `rose-revenue-site`. So these are two deploys of the same commit 14 minutes apart. That matches fixing the framework preset and redeploying. The live site (`rose-revenue-site.vercel.app` and rose-revenue.com) is served by **rose-revenue-site**.

**How to double-check (30 seconds; I can't list your Vercel projects from here):**
1. Open the **pauls-projects** team's project list.
2. Any project *other than* **rose-revenue-site** whose Git repository is `dpaulheintz/rose-revenue` is a leftover. Go to **Settings → Git → Disconnect** on that one only.
3. **Don't touch rose-revenue-site.**
