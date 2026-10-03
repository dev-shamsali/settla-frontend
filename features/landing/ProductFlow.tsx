import { Reveal } from "./Reveal";

const NODES = ["Customer", "Settla", "Rhea", "Investigate", "Policy + Risk", "Approved action", "Verify", "Resolved / Human review"];

/** Infrastructure-style flow: thin lines, one small travelling highlight per connector (CSS transform only). */
export function ProductFlow() {
  return (
    <section aria-labelledby="flow-title" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <Reveal><p className="l-label">The resolution path</p></Reveal>
      <Reveal delay={80}><h2 id="flow-title" className="mt-4 max-w-2xl text-3xl font-light leading-[1.08] tracking-[-0.03em] sm:text-4xl lg:text-5xl">Every case follows the same verified path.</h2></Reveal>

      <Reveal delay={140} className="mt-12">
        {/* desktop: horizontal */}
        <ol className="hidden items-center lg:flex" aria-label="Resolution flow">
          {NODES.map((n, i) => (
            <li key={n} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span className={`l-glass whitespace-nowrap rounded-full px-3.5 py-2 text-xs ${i === 2 ? "border-white/40 text-white" : "text-white/80"}`}>{n}</span>
              {i < NODES.length - 1 && <span className="l-flow-line l-flow-line--h mx-1.5 flex-1" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        {/* mobile/tablet: vertical */}
        <ol className="flex flex-col items-center lg:hidden" aria-label="Resolution flow">
          {NODES.map((n, i) => (
            <li key={n} className="flex flex-col items-center">
              <span className={`l-glass rounded-full px-4 py-2 text-sm ${i === 2 ? "border-white/40 text-white" : "text-white/80"}`}>{n}</span>
              {i < NODES.length - 1 && <span className="l-flow-line l-flow-line--v my-1" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
