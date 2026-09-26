import Image from "next/image";
import Reveal from "@/components/Reveal";
import HeroArt from "@/components/HeroArt";
import Wordmark from "@/components/Wordmark";
import StickyCta from "@/components/StickyCta";
import PileCalculator from "@/components/PileCalculator";
import OnePlaceApp from "@/components/OnePlaceApp";
import LaunchVideo from "@/components/LaunchVideo";
import BookingSlot from "@/components/BookingSlot";

const steps = [
  {
    n: "01",
    title: "A free 15-minute call.",
    body: "Tell me what’s slowing you down. If I can’t help, I’ll say so.",
  },
  {
    n: "02",
    title: "The assessment.",
    body: "Two to three weeks. I learn how you really work: what to automate, what to build, and what software you’re paying for that you don’t need. It ends with a fixed quote.",
  },
  {
    n: "03",
    title: "We build it together.",
    body: "You’re in the room for all of it. Most builds take a few weeks.",
  },
  {
    n: "04",
    title: "You own it.",
    body: "The code is yours, in your own GitHub. Your data is yours, anytime. And you know how it works.",
  },
];

const included = [
  "Training for your whole team, including how to use AI where it actually helps.",
  "A written data and AI policy, so your data and your customers stay protected.",
  "Getting the systems you keep talking to each other.",
  "Real numbers on hours saved and money cut.",
  "Need a change or a fix? Tell me, and it gets done fast.",
];

const answers = [
  {
    q: "What does it cost?",
    a: "The assessment ends with a fixed quote. No surprises, and no hourly meter.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. We put the rules in writing before I touch anything, and your data stays yours.",
  },
  {
    q: "Are you replacing my people?",
    a: "No. I’m making their jobs easier. The work they’re best at is the work they’ll finally have time for.",
  },
  {
    q: "I’m not technical.",
    a: "I’m not technical either. We’ll work through it together, and you’ll understand every piece of it by the end.",
  },
  {
    q: "Who owns it?",
    a: "You do. The code is yours, in your own GitHub. Your data is yours, and you can have it anytime. I handle the hosting so you don’t have to.",
  },
  {
    q: "Do I have to stop using my POS?",
    a: "No. I pull your data out of it and put it where it’s actually useful.",
  },
  {
    q: "What happens to the software I already pay for?",
    a: "Some of it stays and gets connected to everything else. Some of it you won’t need anymore. The assessment tells us which is which.",
  },
  {
    q: "How long does a build take?",
    a: "Most builds take a few weeks.",
  },
  {
    q: "Can I make changes later?",
    a: "Yes. Changes and fixes get done fast. Just tell me what you need.",
  },
  {
    q: "What if I stop working with you?",
    a: "Your code and your data go with you.",
  },
];

export default function Home() {
  return (
    <>
      <HeroArt />
      <StickyCta />

      <main id="main" className="relative">
        {/* ============================ 1 · HERO — dusk ============================ */}
        <section id="top" className="snap-flush relative flex min-h-[88svh] flex-col">
          <div className="wrap w-full">
            <header className="pt-7 sm:pt-9">
              <Wordmark />
            </header>

            <div className="mt-[7vh] pb-16 sm:mt-[9vh]">
              <p className="kicker settle text-paper/85">For Midwest small businesses</p>
              <h1 className="h-hero mt-4 max-w-[14ch] text-paper">
                We build the tools your business wishes existed.
              </h1>
              <p className="measure settle mt-6 text-paper [animation-delay:60ms] sm:text-[19px]">
                Silicon Valley built your software for somebody else&rsquo;s business. I build
                Midwest small businesses their own: your customers, your numbers, your
                projects, all in one place you own.
              </p>
              {/* Stacked, not side by side: beside the button, this line would
                  land on the pale path in the art (measured 1.5:1 at 1440px). */}
              <div className="settle mt-8 flex flex-col items-start gap-4 [animation-delay:120ms]">
                <a
                  id="hero-cta"
                  href="#booking"
                  className="inline-flex min-h-13 touch-manipulation items-center gap-2 rounded-full bg-coral px-7 font-medium text-ink transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none"
                >
                  <span>
                    Book a free <span className="whitespace-nowrap">15-minute</span> call
                  </span>
                  <span aria-hidden="true">→</span>
                </a>
                <p className="text-[15px] text-paper/90">
                  Free. No pitch. I&rsquo;ll tell you honestly if I can help.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================== 2 · THE PILE — cold, flat, fluorescent =================== */}
        {/* z-[55] lifts this world above the grain: it's meant to feel flat. */}
        <section aria-labelledby="pile-title" className="world-cold relative z-[55]">
          <div className="band band-dusk-to-cold" aria-hidden="true" />
          <div className="snap-flush bg-cold-bg pt-6 pb-20 text-cold-ink lg:pb-28">
            <div className="wrap grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <div>
                <h2 id="pile-title" className="h-cold">
                  Too many logins. None of them talk to each other.
                </h2>
                <p className="measure mt-6 text-cold-muted">
                  A CRM here. Invoicing there. A project board, a scheduling app, and a
                  spreadsheet holding it all together. Every one of them bills you every month.
                  You use a sliver of each.
                </p>
              </div>
              <PileCalculator />
            </div>
          </div>
          <div className="band band-cold-to-night" aria-hidden="true" />
        </section>

        {/* ===================== 3 · ONE PLACE — warmth returns ===================== */}
        <section aria-labelledby="one-title" className="snap-flush bg-night pt-6 pb-20 lg:pb-30">
          <div className="wrap">
            <Reveal>
              <h2 id="one-title" className="h-section max-w-[13ch] text-paper">
                Now picture one place that&rsquo;s <em className="text-coral">yours.</em>
              </h2>
              <p className="measure mt-6 text-muted">
                I build you one app, set up around how your business actually runs. Your
                customers, your money, your team and your know-how live together, connected,
                and it&rsquo;s yours.
              </p>
            </Reveal>
            <div className="mt-12">
              <OnePlaceApp />
            </div>
            <p className="measure mt-8 text-paper/90">
              It&rsquo;s all connected, so nobody types the same thing twice. Not a
              subscription you&rsquo;ll use 10% of. Yours.
            </p>
          </div>
        </section>

        {/* =========================== 4 · HOW IT WORKS =========================== */}
        <section
          aria-labelledby="how-title"
          className="snap-flush bg-[linear-gradient(180deg,var(--color-night),var(--color-violet))] py-20 lg:py-30"
        >
          <div className="wrap">
            <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <Reveal>
                <h2 id="how-title" className="h-section text-paper">
                  How it works
                </h2>
              </Reveal>
              <ol className="space-y-9">
                {steps.map((s) => (
                  <li key={s.n} className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-paper/15 pt-5">
                    <span aria-hidden="true" className="font-display text-[34px] leading-none text-coral">
                      {s.n}
                    </span>
                    <div>
                      <h3 className="font-display text-[28px] leading-tight text-paper">{s.title}</h3>
                      <p className="mt-2 max-w-[36rem] text-muted">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <figure className="mt-24 lg:mt-32">
              <blockquote>
                <p className="max-w-[20ch] font-display text-[clamp(2.4rem,6.5vw,5.75rem)] leading-[1.02] tracking-[-0.02em] text-balance text-coral">
                  There won&rsquo;t be a tech problem in the world you won&rsquo;t feel
                  confident enough to solve.
                </p>
              </blockquote>
            </figure>
          </div>
        </section>

        {/* ========================== 5 · ALSO INCLUDED ========================== */}
        <section
          aria-labelledby="also-title"
          className="snap-flush bg-[linear-gradient(180deg,var(--color-violet),var(--color-plum))] py-20 lg:py-30"
        >
          <div className="wrap grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Reveal>
              <h2 id="also-title" className="h-section text-paper">
                Also included
              </h2>
            </Reveal>
            <div>
              <ul className="border-b border-paper/15">
                {included.map((item) => (
                  <li key={item} className="flex gap-4 border-t border-paper/15 py-4">
                    <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-coral" />
                    <span className="text-paper/90">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-[36rem] text-[15px] text-muted">
                AI is part of how I build fast and keep it affordable. It&rsquo;s a tool, not
                the pitch.
              </p>
            </div>
          </div>
        </section>

        {/* ===================== 6 · BUILT IN THE MIDWEST — full dusk ===================== */}
        <section aria-labelledby="midwest-title" className="snap-flush relative overflow-hidden bg-plum">
          <Image
            src="/section-band.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-bottom"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-plum)_0%,rgb(27_18_38/0.72)_30%,rgb(27_18_38/0.55)_60%,var(--color-plum)_100%)]"
          />
          <div className="wrap relative py-24 lg:py-36">
            <Reveal>
              <h2 id="midwest-title" className="h-section max-w-[15ch] text-paper">
                Main Street deserves better tools than this.
              </h2>
            </Reveal>
            <div className="mt-10 max-w-[36rem] space-y-5 text-paper/90 lg:ml-[41.66%]">
              <p>
                You&rsquo;re up against chains and private-equity money. They&rsquo;ve got people
                building their tools. You&rsquo;ve got software dreamed up in Silicon Valley for
                somebody else&rsquo;s business.
              </p>
              <p>
                The hard-working businesses that hold Midwest towns together deserve tools that
                fit them. So that&rsquo;s what I build.
              </p>
              <p>
                No enterprise software. No consultants in suits. And nobody gets replaced. Your
                team&rsquo;s jobs get easier, so the work they&rsquo;re best at is the work they
                finally have time for.
              </p>
            </div>
            <LaunchVideo />

          </div>
        </section>

        {/* ============================ 7 · STRAIGHT ANSWERS ============================ */}
        <section aria-labelledby="answers-title" className="snap-flush bg-plum py-20 lg:py-30">
          <div className="wrap grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Reveal>
              <h2 id="answers-title" className="h-section text-paper">
                Straight answers
              </h2>
            </Reveal>
            <div className="border-b border-paper/15">
              {answers.map(({ q, a }) => (
                <details key={q} className="faq border-t border-paper/15">
                  <summary className="flex min-h-14 items-center justify-between gap-6 py-4 font-display text-[24px] leading-snug text-paper">
                    {q}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      width="14"
                      height="14"
                      className="faq-icon shrink-0 text-coral"
                    >
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </summary>
                  <p className="max-w-[36rem] pb-6 text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ================================ 8 · ABOUT ================================ */}
        <section aria-labelledby="about-title" className="snap bg-plum pb-20 lg:pb-30">
          <div className="wrap grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Reveal>
              <h2 id="about-title" className="h-section text-paper">
                Hi, I&rsquo;m Paul.
              </h2>
            </Reveal>
            <p className="max-w-[36rem] text-lg text-paper/90 lg:pt-4">
              I&rsquo;ve built my own business, run sales teams, and built web and phone apps
              from scratch. I&rsquo;m in Columbus, Ohio. I&rsquo;d rather sit across the table
              from you and learn how your business actually runs than sell you software over a
              screen share.
            </p>
          </div>
        </section>

        {/* ===================== 9 · LET'S TALK — the sunset reassembles ===================== */}
        <section id="booking" aria-labelledby="booking-title" className="relative scroll-mt-4">
          <div className="band band-plum-to-sky" aria-hidden="true" />
          <div className="snap bg-[linear-gradient(180deg,rgb(2_13_2/0.35),rgb(2_13_2/0.55)_45%,rgb(2_13_2/0.85))] pb-20 lg:pb-30">
            <div className="wrap">
              <h2 id="booking-title" className="h-section max-w-[16ch] text-paper">
                Book a free <span className="whitespace-nowrap">15-minute</span> call today.
              </h2>
              <p className="measure mt-6 text-paper/90">
                Fifteen minutes. Free. No pitch. Tell me what&rsquo;s slowing you down, and
                I&rsquo;ll tell you honestly whether I can help.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="The call at a glance">
                {["Free", "15 minutes", "No pitch"].map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-paper/30 bg-ink/40 px-3.5 py-1.5 text-[14px] text-paper"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <BookingSlot />
              </div>
            </div>
          </div>
        </section>

        <footer className="relative bg-ink">
          <div className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-10">
            <Wordmark size="sm" />
            <p className="text-[15px] text-muted">Columbus, Ohio</p>
            <a href="#booking" className="text-[15px] text-coral underline-offset-4 hover:underline">
              Book a free call
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
