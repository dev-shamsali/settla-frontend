"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X, Circle, MessageSquare, CreditCard, ShoppingBag, LifeBuoy, Users, Cpu, Siren, Hash, ShieldCheck, Scale } from "lucide-react";
import { cn, time, titleCase, inr, pct, dateTime } from "@/lib/utils";
import { Badge, KV, RiskBadge, StatusBadge } from "@/components/ui/primitives";
import type { CaseDetail, CaseEvent, DecisionDoc, PolicyEval, Trace } from "@/types/api";

const sysIcon: Record<string, React.ElementType> = {
  whatsapp: MessageSquare, email: MessageSquare, razorpay: CreditCard, shopify: ShoppingBag, freshdesk: LifeBuoy, hubspot: Users, slack: Hash, rhea: Cpu, settla: ShieldCheck,
};

/* ---------- Timeline ---------- */
export function CaseTimeline({ events }: { events: CaseEvent[] }) {
  const reduce = useReducedMotion();
  return (
    <ol className="relative space-y-0.5" aria-label="Case timeline">
      <span aria-hidden className="absolute bottom-3 left-[15px] top-3 w-px bg-line" />
      {events.map((e, i) => {
        const Icon = sysIcon[e.system] ?? Circle;
        const bad = e.status === "error", warn = e.status === "warn";
        return (
          <motion.li key={e._id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.02 }} className="relative flex gap-3 py-2">
            <span className={cn("z-10 flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full border bg-paper", bad ? "border-bad/40 text-bad" : warn ? "border-warn/40 text-warn" : "hairline text-burgundy-600")}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <time dateTime={e.ts} className="tabular font-mono text-xs text-ink-muted">{time(e.ts)}</time>
                <span className="text-sm text-ink">{e.action}</span>
                {bad && <Badge tone="bad">error</Badge>}{warn && <Badge tone="warn">attention</Badge>}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-ink-muted">
                <span>{titleCase(e.system)}</span><span>{e.actor}</span><span className="font-mono">{e.type}</span><span className="font-mono">trace {e.traceId?.slice(0, 8)}</span>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/* ---------- Policy checks ---------- */
export function PolicyChecks({ policy }: { policy: PolicyEval | null | undefined }) {
  if (!policy) return <p className="text-sm text-ink-muted">No policy was evaluated for this decision.</p>;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-mono text-xs">{policy.policy}</span>
        <Badge tone={policy.passed ? "ok" : policy.requiresApproval ? "warn" : "bad"}>{policy.passed ? "Passed" : policy.requiresApproval ? "Approval required" : "Failed"}</Badge>
      </div>
      <ul className="space-y-1.5">
        {policy.evaluatedRules.map((r) => (
          <li key={r.id} className="flex items-start gap-2 text-sm">
            {r.passed ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="passed" /> : <X className={cn("mt-0.5 h-4 w-4 shrink-0", r.severity === "approval" ? "text-warn" : "text-bad")} aria-label="failed" />}
            <div className="min-w-0"><div className={cn(!r.passed && "font-medium")}>{r.description}</div><div className="truncate font-mono text-[11px] text-ink-muted">{r.detail}</div></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Rhea panel: safe structured reasoning (no hidden chain-of-thought) ---------- */
export function RheaPanel({ d }: { d: CaseDetail }) {
  const c = d.case;
  const dec: DecisionDoc | undefined = d.decisions[0];
  const plan = dec?.plan;
  const lastAction = d.actions.at(-1);
  const active = ["OBSERVING", "INVESTIGATING", "DECIDING", "EXECUTING", "VERIFYING"].includes(c.status);
  const limit = (plan?.parameters as { limit?: number } | undefined)?.limit;
  const nextAction = c.status === "AWAITING_APPROVAL" ? "Waiting for a human approver" : c.status === "ESCALATED" ? "Human takeover required" : c.status === "WAITING_REVERSAL" ? "Recheck payment after auto-reversal window" : c.followUpsPending?.length ? `Retry follow-ups: ${c.followUpsPending.join(", ")}` : ["RESOLVED", "REFUNDED", "CLOSED"].includes(c.status) ? "None — case complete" : "Continue investigation";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative flex h-2.5 w-2.5"><span className={cn("absolute inline-flex h-full w-full rounded-full bg-burgundy-500", active && "pulse-dot")} /></span>
        <div className="text-sm"><span className="font-medium">Rhea</span> <span className="text-ink-muted">· {active ? `working: ${titleCase(c.status)}` : titleCase(c.status)}</span></div>
        {c.autonomous !== null && <Badge tone={c.autonomous ? "ok" : "warn"}>{c.autonomous ? "Autonomous" : "Human involved"}</Badge>}
      </div>
      {!plan ? <p className="text-sm text-ink-muted">Rhea has not produced a decision yet.</p> : (
        <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <KV k="Decision" v={<span className="font-medium">{titleCase(plan.decision)}</span>} />
          <KV k="Confidence" v={pct(plan.confidence)} />
          <KV k="Risk" v={<RiskBadge level={c.risk?.level} score={c.risk?.score} />} />
          <KV k="Action" v={<span className="font-mono text-xs">{plan.tool}</span>} />
          <KV k="Permission" v={<span className="font-mono text-xs">{plan.required_permission}</span>} />
          <KV k="Amount" v={inr(plan.amount)} />
          {limit !== undefined && <KV k="Limit" v={inr(limit)} />}
        </dl>
      )}
      {plan && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div><div className="eyebrow mb-2">Evidence</div><ul className="space-y-1 text-sm">{plan.evidence.map((e) => <li key={e} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />{e}</li>)}</ul></div>
          <div><div className="eyebrow mb-2">Verification</div>
            {lastAction?.verification ? <ul className="space-y-1 text-sm">{lastAction.verification.checks.map((v) => <li key={v.name} className="flex gap-2">{v.passed ? <Check className="mt-0.5 h-3.5 w-3.5 text-ok" /> : <X className="mt-0.5 h-3.5 w-3.5 text-bad" />}{titleCase(v.name)}</li>)}</ul>
              : <p className="text-sm text-ink-muted">{plan.verification_plan.length ? `Planned: ${plan.verification_plan.join(" · ")}` : "Nothing to verify yet."}</p>}
          </div>
        </div>
      )}
      {dec?.overrides?.length ? <div className="rounded-xl bg-warn-bg p-3 text-xs text-warn"><span className="font-semibold">Hard rules overrode the AI proposal:</span> {dec.overrides.join(", ")}</div> : null}
      <div className="flex flex-wrap gap-x-8 gap-y-1 border-t hairline pt-3 text-sm">
        <div><span className="text-ink-muted">Next action: </span>{nextAction}</div>
        <div><span className="text-ink-muted">Escalation: </span>{c.escalationReason ? <Badge tone="warn">{titleCase(c.escalationReason)}</Badge> : "None"}</div>
      </div>
    </div>
  );
}

/* ---------- Decision trace ---------- */
export function TraceView({ t }: { t: Trace }) {
  const rows: [string, React.ReactNode][] = [
    ["Proposal", titleCase(t.proposal)], ["Payment", <span key="p" className="font-mono">{t.paymentId}</span>], ["Amount", inr(t.amount)],
    ["Rules", <span key="r" className="flex flex-wrap justify-end gap-1">{t.rules.map((r) => <Badge key={r.id} tone={r.passed ? "ok" : "bad"}>{r.id.replace(/_/g, " ")}</Badge>)}</span>],
    ["Policy", <span key="po" className="font-mono">{t.policy}</span>], ["Risk", t.risk], ["Permission", <span key="pe" className="font-mono">{t.permission}</span>],
    ["Idempotency", t.idempotency], ["Execution", <span key="e" className="font-mono">{t.execution}</span>],
    ["Verification", <Badge key="v" tone={t.verification === "PASSED" ? "ok" : t.verification === "FAILED" ? "bad" : "neutral"}>{t.verification}</Badge>],
    ["Final", <StatusBadge key="f" status={t.final} />],
  ];
  return (
    <div>
      <div className="mb-2 font-mono text-xs text-ink-muted">{t.caseNumber}</div>
      <dl className="divide-y hairline">{rows.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-6 py-2 text-sm"><dt className="text-ink-muted">{k}</dt><dd className="text-right">{v}</dd></div>)}</dl>
      {t.overrides?.length ? <p className="mt-3 text-xs text-warn">Overrides: {t.overrides.join(", ")}</p> : null}
    </div>
  );
}

/* ---------- Small cards ---------- */
export function CustomerCard({ d }: { d: CaseDetail }) {
  const u = d.customer;
  return (
    <dl>
      <KV k="Name" v={u?.name ?? d.case.customerName ?? "—"} /><KV k="Email" v={u?.email ?? d.case.customerEmail ?? "—"} /><KV k="Phone" v={u?.phone ?? "—"} />
      <KV k="Prior refunds" v={u?.refundCount ?? 0} /><KV k="Blocked" v={u?.blocked ? <Badge tone="bad">Blocked</Badge> : "No"} /><KV k="Channel" v={titleCase(d.case.channel ?? "api")} />
    </dl>
  );
}
export function PaymentCard({ d }: { d: CaseDetail }) {
  const p = d.payment;
  return (
    <dl>
      <KV k="Payment ID" v={d.case.paymentId} mono /><KV k="Gateway" v={titleCase(d.case.gateway)} /><KV k="Status" v={p ? <Badge tone={p.status === "captured" ? "ok" : "warn"}>{titleCase(p.status)}</Badge> : "—"} />
      <KV k="Amount" v={<span className="tabular font-medium">{inr(d.case.amount)}</span>} /><KV k="Refunded" v={inr(p?.amountRefunded ?? 0)} />
    </dl>
  );
}
export function OrderCard({ d }: { d: CaseDetail }) {
  const o = d.orders[0];
  return (
    <div>
      {o ? <dl><KV k="Order" v={o.orderNumber} mono /><KV k="Total" v={inr(o.total)} /><KV k="Status" v={<Badge tone="ok">{titleCase(o.status)}</Badge>} /></dl>
        : <p className="text-sm text-ink-muted">No order is linked to this payment{["RESOLVED"].includes(d.case.status) ? "" : " (this is the mismatch Rhea is resolving)"}.</p>}
      {d.cart && (
        <div className="mt-3 border-t hairline pt-3"><div className="eyebrow mb-1.5">Cart</div>
          {d.cart.items.map((i) => <div key={i.sku} className="flex justify-between text-sm"><span>{i.name ?? i.sku} × {i.qty}</span><span className="tabular">{inr(i.price)}</span></div>)}
          <div className="mt-1 flex justify-between border-t hairline pt-1 text-sm font-medium"><span>Total</span><span className="tabular">{inr(d.cart.total)}</span></div>
        </div>
      )}
    </div>
  );
}
export const Legal = Scale; export const SirenIcon = Siren; export { dateTime };
