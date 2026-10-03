import { Reveal } from "./Reveal";

const STEPS = [
  ["01", "Investigate", "Understand payment, order, customer, and case context."],
  ["02", "Decide", "Apply policy, risk, permissions, and business rules."],
  ["03", "Resolve", "Execute the permitted action through trusted integrations."],
  ["04", "Verify", "Confirm the external state changed as expected."],
  ["05", "Escalate", "Send uncertain or high-risk cases to a human with the full investigation attached."],
] as const;

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-center px-5 py-24 sm:px-8">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal><p className="l-label">How Settla works</p></Reveal>
          <Reveal delay={80}><h2 id="how-title" className="mt-4 text-4xl font-light leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">From payment issue<br />to verified resolution.</h2></Reveal>
          <Reveal delay={160}><p className="mt-6 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">Rhea investigates the context behind every case, applies your business rules, executes only permitted actions, and verifies the result before closing the loop.</p></Reveal>
        </div>
        <ol>
          {STEPS.map(([n, t, d], i) => (
            <Reveal as="li" key={n} delay={i * 60} className="grid grid-cols-[3.2rem_1fr] gap-4 border-t border-white/12 py-7 sm:grid-cols-[4.5rem_1fr]">
              <span className="l-label pt-1.5">{n}</span>
              <div>
                <h3 className="text-xl font-light tracking-tight sm:text-2xl">{t}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">{d}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
