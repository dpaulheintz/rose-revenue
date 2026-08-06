import Image from "next/image";
import Reveal from "@/components/Reveal";
import BookingEmbed from "@/components/BookingEmbed";

const pillars = [
  {
    img: "/pillar-1.webp",
    alt: "A glowing lightbulb standing on the horizon at dusk",
    title: "Teach you AI for real",
    body: "Most people use AI like a search engine. That's about 5% of it. We'll show you where it actually fits into your day.",
  },
  {
    img: "/pillar-2.webp",
    alt: "A magnifying glass resting over a sheet of paper",
    title: "Assess your business",
    body: "Two to three weeks. We find what can be automated, what should be built, and what software you're paying for that you don't need.",
  },
  {
    img: "/pillar-3.webp",
    alt: "A screwdriver lying on a workbench at dusk",
    title: "Build what's missing",
    body: "Custom tools made for your business — not a subscription you'll use 10% of.",
  },
  {
    img: "/pillar-4.webp",
    alt: "An open book resting on the ground, lit by the sunset",
    title: "Build your knowledge base",
    body: "Everything your company knows, in one place your team can use.",
  },
];

const alsoIncluded = [
  "A written AI policy so your data and your customers stay protected",
  "Training for your whole team, not just you",
  "Getting your systems talking to each other",
  "Real numbers on hours saved and money cut",
  "Ongoing support after we're done, if you want it",
];

const steps = [
  {
    n: "01",
    title: "Free 15-minute call",
    body: "Tell me what's slowing you down.",
  },
  {
    n: "02",
    title: "The assessment",
    body: "Two to three weeks. I learn how you really work.",
  },
  {
    n: "03",
    title: "We build",
    body: "Together. You're in the room for all of it.",
  },
  {
    n: "04",
    title: "You own it",
    body: "It's yours. You know how it works.",
  },
];

const answers = [
  {
    q: "Is my data safe?",
    a: "Yes. We set the rules before we touch anything, and your information stays yours.",
  },
  {
    q: "Are you replacing my people?",
    a: "No. We're making their jobs easier. The work they're best at is the work they'll finally have time for.",
  },
  {
    q: "I'm not technical.",
    a: "Neither am I. We'll work through everything together, and you'll understand every piece of it by the end.",
  },
];

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- *
       * Hero background — fixed, so the page scrolls up over it (parallax).
       * <picture> art-directs: hero-mobile below 640px, hero above.
       * Rendered through next/image with priority.
       * ---------------------------------------------------------------- */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/hero.webp"
          alt="A pale path winding over green hills toward distant mountains under a coral and rose sunset sky"
          fill
          priority
          sizes="100vw"
          className="hidden object-cover sm:block"
        />
        <Image
          src="/hero-mobile.webp"
          alt="A pale path winding over green hills toward distant mountains under a coral and rose sunset sky"
          fill
          priority
          sizes="100vw"
          className="object-cover sm:hidden"
        />
        {/* Scrim: darkens the upper sky so the headline reads cleanly,
            while leaving the illustrated hills and road untouched. */}
        <div className="absolute inset-x-0 top-0 h-[72%] bg-gradient-to-b from-ink/80 via-ink/35 to-transparent" />
      </div>

      <main className="relative z-10">
        {/* ============================== HERO ============================== */}
        <section className="relative flex h-[85vh] min-h-[560px] flex-col">
          <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-6 sm:px-8">
            <div className="pt-8 sm:pt-10">
              <span className="font-display text-2xl tracking-tight text-paper sm:text-[1.75rem]">
                Rose Revenue
              </span>
            </div>

            <div className="mt-[7vh] max-w-[62rem] sm:mt-[9vh]">
              <h1 className="h1-display max-w-[15ch] text-paper">
                We build the tools your business wishes existed.
              </h1>
              <p className="measure mt-7 text-base leading-relaxed text-paper/90 sm:text-lg">
                Rose Revenue helps small businesses use AI to do more with what
                they already have. No enterprise software. No consultants in
                suits. Just tools built for how you actually work.
              </p>
              <a
                href="#booking"
                className="mt-9 inline-flex items-center gap-2 rounded-full bg-coral px-7 py-3.5 text-sm text-ink transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
              >
                Book a free 15-minute call
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* Everything below the hero rides on the solid ink background,
            scrolling up over the fixed hero image. */}
        <div className="bg-ink">
          {/* ========================= WHAT WE DO ========================= */}
          <section className="mx-auto max-w-[1100px] px-6 py-32 sm:px-8">
            <Reveal>
              <h2 className="h-section text-paper">What we do</h2>
            </Reveal>
            <div className="mt-16 grid gap-x-12 gap-y-16 sm:grid-cols-2">
              {pillars.map((p, i) => (
                <Reveal key={p.title} delay={i % 2 === 1 ? 80 : 0}>
                  <div>
                    <Image
                      src={p.img}
                      alt={p.alt}
                      width={80}
                      height={80}
                      className="h-20 w-20 object-contain"
                    />
                    <h3 className="h-section mt-6 text-[1.6rem] text-paper">
                      {p.title}
                    </h3>
                    <p className="measure mt-3 leading-relaxed text-muted">
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ======================= ALSO INCLUDED ======================= */}
          <section className="mx-auto max-w-[1100px] px-6 py-32 sm:px-8">
            <Reveal>
              <h2 className="h-section text-paper">Also included</h2>
            </Reveal>
            <Reveal>
              <ul className="mt-14 max-w-3xl">
                {alsoIncluded.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-5 border-t border-hill/60 py-6 last:border-b"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral"
                    />
                    <span className="text-lg leading-relaxed text-paper/90">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>

          {/* ======================== HOW IT WORKS ======================== */}
          <section className="mx-auto max-w-[1100px] px-6 py-32 sm:px-8">
            <Reveal>
              <h2 className="h-section text-paper">How it works</h2>
            </Reveal>
            <ol className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.n} delay={i % 2 === 1 ? 80 : 0}>
                  <div className="flex gap-6">
                    <span
                      className="font-display text-4xl leading-none text-coral sm:text-5xl"
                      aria-hidden="true"
                    >
                      {s.n}
                    </span>
                    <div>
                      <h3 className="h-section text-[1.5rem] text-paper">
                        {s.title}
                      </h3>
                      <p className="measure mt-2 leading-relaxed text-muted">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </section>

          {/* =================== SECTION BAND (full-bleed) =================== */}
          <div className="relative h-[40vh] min-h-[280px] w-full">
            <Image
              src="/section-band.webp"
              alt="A quiet valley at dusk, the coral sky deepening over dark treelines"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* ==================== WHEN WE'RE DONE (quote) ==================== */}
          <section className="px-6 py-36 sm:px-8">
            <Reveal className="mx-auto max-w-[1100px]">
              <p className="sr-only">When we&rsquo;re done</p>
              <blockquote className="font-display text-coral">
                <p
                  className="max-w-[16ch] text-[clamp(2.75rem,7vw,6rem)] leading-[1.02] tracking-[-0.02em] sm:max-w-[20ch]"
                >
                  There won&rsquo;t be a tech problem in the world you won&rsquo;t
                  feel confident enough to solve.
                </p>
              </blockquote>
            </Reveal>
          </section>

          {/* ======================= STRAIGHT ANSWERS ======================= */}
          <section className="mx-auto max-w-[1100px] px-6 py-32 sm:px-8">
            <Reveal>
              <h2 className="h-section text-paper">Straight answers</h2>
            </Reveal>
            <dl className="mt-16 space-y-14">
              {answers.map((item) => (
                <Reveal key={item.q}>
                  <div>
                    <dt className="h-section text-[1.5rem] text-paper">
                      {item.q}
                    </dt>
                    <dd className="measure mt-3 text-lg leading-relaxed text-muted">
                      {item.a}
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </section>

          {/* ============================= ABOUT ============================= */}
          <section className="mx-auto max-w-[1100px] px-6 py-32 sm:px-8">
            <Reveal>
              <h2 className="h-section text-paper">About</h2>
            </Reveal>
            <Reveal>
              <p className="measure mt-10 text-lg leading-relaxed text-paper/90">
                I&rsquo;m Paul Heintzman. I&rsquo;ve built my own business, run
                sales teams, and built web apps and phone apps from scratch.
                I&rsquo;m based in Columbus, Ohio. I&rsquo;d rather sit down with
                you and learn how your business actually runs than sell you
                software over a screen share.
              </p>
            </Reveal>
          </section>

          {/* ============================ BOOKING ============================ */}
          <section
            id="booking"
            className="mx-auto max-w-[1100px] scroll-mt-8 px-6 py-32 sm:px-8"
          >
            <Reveal>
              <h2 className="h1-display text-[clamp(2.75rem,6vw,5rem)] text-paper">
                Let&rsquo;s talk.
              </h2>
              <p className="measure mt-6 text-lg leading-relaxed text-muted">
                Fifteen minutes, free, no pitch. Tell me what&rsquo;s slowing you
                down and I&rsquo;ll tell you honestly whether I can help.
              </p>
            </Reveal>
            <Reveal className="mt-12">
              <BookingEmbed />
            </Reveal>
          </section>

          {/* ============================ FOOTER ============================ */}
          <footer className="border-t border-hill/50">
            <div className="mx-auto flex max-w-[1100px] px-6 py-10 sm:px-8">
              <p className="text-sm text-muted">
                Rose Revenue — Columbus, Ohio
              </p>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
