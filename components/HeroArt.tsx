import { getImageProps } from "next/image";

const alt =
  "A pale path winding over green hills toward distant mountains under a coral and rose sunset sky";

/**
 * The dusk art, fixed behind the whole page (the booking section lets it
 * show through again at the end). A real <picture>, so phones only
 * download hero-mobile.webp and desktops only hero.webp.
 */
export default function HeroArt() {
  const common = { alt, fill: true, sizes: "100vw" } as const;
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: "/hero.webp", quality: 80 });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, src: "/hero-mobile.webp", quality: 75 });

  return (
    // -z-10: behind every opaque section, above the html background.
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <picture>
        <source media="(min-width: 640px)" srcSet={desktop} />
        <img
          {...rest}
          srcSet={mobile}
          alt={alt}
          fetchPriority="high"
          loading="eager"
          className="object-cover"
        />
      </picture>
      {/* Scrim: darkens the upper sky so the hero text clears WCAG AA on
          phones, while the hills and the path stay untouched. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(2_13_2/0.86)_0%,rgb(2_13_2/0.62)_34%,rgb(2_13_2/0.28)_60%,rgb(2_13_2/0)_78%)]" />
    </div>
  );
}
