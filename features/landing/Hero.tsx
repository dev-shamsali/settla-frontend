import { Reveal } from "./Reveal";
import { ResolutionCard } from "./ResolutionCard";

const SERVICES = ["Payment investigation", "AI resolution", "Automated verification"];

export function Hero() {
  return (
    <section id="product" className="mx-auto flex min-h-[100svh] w-full max-w-7xl items-center px-5 pb-16 pt-28 sm:px-8 lg:pt-24">
      <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:gap-16">
        <div>
          <Reveal><p className="l-label">AI payment resolution</p></Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-[2.5rem] font-light leading-[1.04] tracking-[-0.035em] sm:text-6xl lg:text-[4.1rem] xl:text-[4.9rem]">
              Resolve. Verify.<br />Settle automatically.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Settla&apos;s AI investigates payment issues, resolves eligible cases, verifies every action, and escalates the rest to your team.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-medium text-black transition-colors hover:bg-white/85">Request a Demo</a>
            <a href="#how" className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-sm text-white transition-colors hover:bg-white/10">See How It Works</a>
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2" aria-label="Capabilities">
              {SERVICES.map((s) => <li key={s} className="l-label"><span aria-hidden="true">/ </span>{s}</li>)}
            </ul>
            <p className="mt-6 max-w-md text-xs text-white/65">Built for payment operations, customer support, and high-volume commerce.</p>
          </Reveal>
        </div>
        <Reveal delay={200} className="lg:justify-self-end"><ResolutionCard /></Reveal>
      </div>
    </section>
  );
}
