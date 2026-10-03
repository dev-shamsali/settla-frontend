import { Reveal } from "./Reveal";

const CONTROLS = [
  ["Policy Gates", "Versioned rules decide what may run"],
  ["Risk Controls", "Explainable score on every case"],
  ["RBAC", "Permissions re-checked on each request"],
  ["Idempotency", "A duplicate action can never run twice"],
  ["Verification", "Every write is read back and confirmed"],
  ["Audit Trail", "Append-only record of every step"],
  ["Human Escalation", "The full case file goes to your team"],
] as const;

export function SecuritySection() {
  return (
    <section id="security" aria-labelledby="security-title" className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal><p className="l-label">Built for control</p></Reveal>
          <Reveal delay={80}><h2 id="security-title" className="mt-4 text-4xl font-light leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">Automation without<br />losing control.</h2></Reveal>
          <Reveal delay={160}><p className="mt-6 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">Settla separates AI reasoning from authoritative business rules. Every action is policy-checked, permission-aware, idempotent, verified, and auditable.</p></Reveal>
        </div>
        <ul className="grid content-start gap-2.5 sm:grid-cols-1" aria-label="Controls">
          {CONTROLS.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 45} className="l-glass flex items-center justify-between gap-4 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-white">{t}</span>
              <span className="text-right text-xs text-white/70 sm:text-sm">{d}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
