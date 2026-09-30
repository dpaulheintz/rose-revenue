"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_LINK } from "@/lib/booking";

/**
 * BookingEmbed — live Cal.com inline embed for the discovery call.
 *
 * Styling is tuned to the site palette (see app/globals.css):
 *   - dark theme
 *   - brand/accent = coral #fc5f60 (our one accent color), applied via
 *     both branding.brandColor and the `cal-brand` CSS var
 *   - surfaces nudged toward the page's ink/teal tones so the widget
 *     reads as part of the page rather than a bolted-on iframe
 *
 * To point at a different event, change CAL_LINK in lib/booking.ts.
 */
const NAMESPACE = "discovery-call";

// Palette tokens mirrored from globals.css so the embed matches the site.
const COLORS = {
  coral: "#fc5f60", // accent
  coralText: "#020d02", // ink — text on coral (matches our button)
  ink: "#020d02", // page background
  ink2: "#17242d", // raised surface
  hill: "#243825", // hairlines / borders
  paper: "#f2e4dd", // primary text
  muted: "#b7a7a3", // secondary text
};

export default function BookingEmbed() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: NAMESPACE });
      cal("ui", {
        theme: "dark",
        hideEventTypeDetails: false,
        layout: "month_view",
        styles: {
          branding: { brandColor: COLORS.coral },
        },
        cssVarsPerTheme: {
          dark: {
            "cal-brand": COLORS.coral,
            "cal-brand-emphasis": COLORS.coral,
            "cal-brand-text": COLORS.coralText,
            "cal-bg": COLORS.ink,
            "cal-bg-emphasis": COLORS.ink2,
            "cal-bg-muted": COLORS.ink2,
            "cal-border": COLORS.hill,
            "cal-border-emphasis": COLORS.hill,
            "cal-text": COLORS.paper,
            "cal-text-emphasis": COLORS.paper,
            "cal-text-muted": COLORS.muted,
          },
          // Provide a matching light map too, in case a viewer forces light.
          light: {
            "cal-brand": COLORS.coral,
            "cal-brand-text": COLORS.coralText,
          },
        },
      });
    })();
  }, []);

  return (
    <div className="overflow-hidden rounded-sm border border-hill/50 bg-ink-2/40">
      <Cal
        namespace={NAMESPACE}
        calLink={CAL_LINK}
        style={{ width: "100%", height: "100%", minHeight: "680px", overflow: "scroll" }}
        config={{ layout: "month_view", theme: "dark" }}
      />
    </div>
  );
}
