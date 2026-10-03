import { Check, ArrowRight } from "lucide-react";

/** Static, illustrative product visual. No backend calls, no real data. */
export function ResolutionCard() {
  return (
    <aside className="l-glass l-glass--blur w-full max-w-md rounded-2xl p-5 sm:p-6" aria-label="Illustrative Rhea resolution card (sample data)">
      <div className="flex items-start justify-between">
        <div>
          <div className="l-label">Rhea</div>
          <div className="mt-0.5 text-sm text-white/80">AI resolution agent</div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/70">
          <span className="l-dot h-1.5 w-1.5 rounded-full bg-[var(--l-warn)]" aria-hidden="true" />Investigating
        </span>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <div className="text-xs text-white/70">Payment issue detected</div>
        <div className="mt-1 text-3xl font-light tracking-tight tabular-nums">₹3,499</div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-white/70">Payment</dt><dd className="text-[var(--l-ok)]">Received</dd></div>
          <div className="flex justify-between"><dt className="text-white/70">Order</dt><dd className="text-[var(--l-warn)]">Not created</dd></div>
        </dl>
      </div>

      <ol className="mt-5 space-y-2 text-sm text-white/80">
        <li className="l-check flex items-center gap-2" style={{ animationDelay: "500ms" }}><Check className="h-4 w-4 text-[var(--l-ok)]" aria-hidden="true" />Payment verified</li>
        <li className="l-check flex items-center gap-2" style={{ animationDelay: "1100ms" }}><Check className="h-4 w-4 text-[var(--l-ok)]" aria-hidden="true" />Order status checked</li>
        <li className="l-check flex items-center gap-2 text-white" style={{ animationDelay: "1700ms" }}><ArrowRight className="h-4 w-4" aria-hidden="true" />Resolution recommended</li>
      </ol>

      <a href="/login" className="mt-6 flex w-full items-center justify-center rounded-full border border-white/20 py-2.5 text-sm text-white transition-colors hover:bg-white/10">Review case</a>
      <p className="mt-3 text-center text-[11px] text-white/65">Sample data for illustration</p>
    </aside>
  );
}
