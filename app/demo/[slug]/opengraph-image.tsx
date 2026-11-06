import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { demoSlugs, getConfig, getMeta } from "@demos/index";

// The link-preview card: drawn from each demo's brand colors and name at build time.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Concept demo by Rose Revenue";
export const dynamicParams = false;
export const generateStaticParams = () => demoSlugs.map((slug) => ({ slug }));

/** The headline font as TTF (satori can't read woff2). Falls back to the default font if offline. */
async function loadFont(family: string, weight: number) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

const MARKS: Record<string, string> = {
  grass: "M15.2 29c-.6-6.400-2.600-12.300-7.700-18.100 4.600 3 7.600 7.300 9.300 12.600.3-6.700 2.100-13.300 6-19.500-1.700 6.600-2.500 13.400-2.200 20.500l.1 4.500Z",
  mountain: "M2 26 11 9l6 10 4-6 9 13H2Z",
  gear: "M14 3h4l.8 3.4 2.5 1 3-1.800 2.800 2.800-1.800 3 1 2.500L30 14.700v4l-3.400.8-1 2.500 1.800 3-2.800 2.800-3-1.800-2.500 1L18 30h-4l-.8-3.400-2.500-1-3 1.800-2.800-2.800 1.800-3-1-2.500L2 18.700v-4l3.400-.8 1-2.500-1.800-3 2.800-2.800 3 1.800 2.500-1L14 3Zm2 8.500a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cfg = getConfig(slug)!;
  const { og } = getMeta(slug)!;
  const font = og.font ? await loadFont(og.font.family, og.font.weight) : null;
  const logo = og.logo ? `data:image/png;base64,${(await readFile(join(process.cwd(), "public", og.logo))).toString("base64")}` : null;
  const display = font ? og.font!.family : undefined;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: og.bg, color: og.fg, borderBottom: `14px solid ${og.accent}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logo ? (
            <img src={logo} width={112} height={112} alt="" />
          ) : og.noMark ? null : (
            <svg viewBox="0 0 32 33" width={92} height={92}><path d={MARKS[og.mark ?? "grass"]} fill={og.accent} fillRule="evenodd" /></svg>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 38, fontFamily: display, display: "flex" }}>{cfg.company.name}</div>
            <div style={{ fontSize: 24, opacity: 0.75, display: "flex" }}>{cfg.company.place}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.08, fontFamily: display, letterSpacing: "-0.01em", display: "flex", maxWidth: 1040 }}>{og.headline}</div>
          <div style={{ fontSize: 30, lineHeight: 1.3, opacity: 0.85, display: "flex", maxWidth: 980 }}>{og.sub}</div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.7, display: "flex" }}>Concept demo with sample data · Rose Revenue</div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: og.font!.family, data: font, weight: og.font!.weight as 400 | 700, style: "normal" }] : undefined },
  );
}
