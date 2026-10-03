"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { casesApi } from "@/services";
import { Badge, DemoBadge, ErrorState, KV, Panel, PanelHeader, RiskBadge, Skeleton, StatusBadge } from "@/components/ui/primitives";
import { CaseTimeline, CustomerCard, OrderCard, PaymentCard, PolicyChecks, RheaPanel, TraceView } from "./CaseParts";
import { CaseActions } from "./CaseActions";
import { dateTime, inr, ms, pct, titleCase } from "@/lib/utils";

export function CaseDetailView({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["case", id], queryFn: () => casesApi.get(id), refetchInterval: (s) => (["NEW", "OBSERVING", "INVESTIGATING", "DECIDING", "EXECUTING", "VERIFYING"].includes(s.state.data?.case.status ?? "") ? 3000 : false) });
  if (q.isLoading) return <div className="space-y-4"><Skeleton className="h-16" /><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div></div>;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const d = q.data, c = d.case, dec = d.decisions[0];
  const hasNeedsHuman = d.approvals.some((a) => a.status === "PENDING") || d.escalations.some((e) => e.status === "OPEN" || e.status === "IN_PROGRESS");

  return (
    <div className="pb-24 lg:pb-0">
      <Link href="/cases" className="mb-3 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />All cases</Link>
      <header className="glass mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl p-5">
        <div><div className="eyebrow">Case</div><h1 className="font-display text-3xl">{c.caseNumber}</h1></div>
        <StatusBadge status={c.status} />
        <div><div className="eyebrow">Risk</div><RiskBadge level={c.risk?.level} score={c.risk?.score} /></div>
        <div><div className="eyebrow">Confidence</div><span className="tabular text-sm font-medium">{pct(c.confidence)}</span></div>
        <div><div className="eyebrow">Amount</div><span className="tabular text-sm font-medium">{inr(c.amount)}</span></div>
        <div><div className="eyebrow">Resolution</div><span className="tabular text-sm font-medium">{ms(c.resolutionMs)}</span></div>
        {c.demo && <DemoBadge />}
        <div className="ml-auto text-right text-xs text-ink-muted"><div>Opened {dateTime(c.createdAt)}</div><div className="font-mono">trace {c.traceId?.slice(0, 12)}</div></div>
      </header>

      {hasNeedsHuman && (
        <div role="status" className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-warn/30 bg-warn-bg px-5 py-3 text-sm text-warn">
          <b>Needs a human.</b>
          <span>{d.approvals.some((a) => a.status === "PENDING") ? "Approval is required before Rhea can act." : `Escalated: ${titleCase(c.escalationReason ?? "review needed")}.`}</span>
          <span className="text-warn/80">Rhea already did: {d.actions.filter((a) => a.state === "VERIFIED").map((a) => a.tool).join(", ") || "investigation only, nothing executed"}.</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-3">
            <Panel><PanelHeader title="Customer" /><CustomerCard d={d} /></Panel>
            <Panel><PanelHeader title="Payment" /><PaymentCard d={d} /></Panel>
            <Panel><PanelHeader title="Order & cart" /><OrderCard d={d} /></Panel>
          </div>
          {c.customerMessage && <Panel><PanelHeader title="Customer message" hint="Treated as untrusted data, never as instructions" /><blockquote className="rounded-lg bg-black/[0.03] p-3 text-sm text-ink-soft">{c.customerMessage}</blockquote></Panel>}
          <Panel strong><PanelHeader title="Rhea" hint="Structured reasoning: evidence, factors, policy, verification" /><RheaPanel d={d} /></Panel>
          <Panel><PanelHeader title="Timeline" hint={`${d.events.length} events`} /><CaseTimeline events={d.events} /></Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <Panel><PanelHeader title="Decision trace" />{d.traces[0] ? <TraceView t={d.traces[0]} /> : <p className="text-sm text-ink-muted">No trace yet.</p>}</Panel>
            <Panel><PanelHeader title="Policy evaluation" />{<PolicyChecks policy={dec?.policyEvaluation} />}</Panel>
          </div>
          <Panel>
            <PanelHeader title="Actions & verification" />
            {d.actions.length === 0 ? <p className="text-sm text-ink-muted">No actions executed.</p> : (
              <ul className="divide-y hairline">
                {d.actions.map((a) => (
                  <li key={a._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="font-mono text-xs">{a.tool}</span>
                    <span className="flex items-center gap-2">{a.verification && <span className="text-xs text-ink-muted">{a.verification.checks.filter((x) => x.passed).length}/{a.verification.checks.length} checks</span>}
                      <Badge tone={a.state === "VERIFIED" ? "ok" : a.state === "COMPENSATED" ? "warn" : ["FAILED", "ESCALATED"].includes(a.state) ? "bad" : "neutral"}>{a.state}</Badge></span>
                    {a.error && <span className="w-full text-xs text-bad">{a.error.message}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel><PanelHeader title="Communication" />
            {d.messages.length === 0 ? <p className="text-sm text-ink-muted">No outbound messages.</p> : d.messages.map((m) => <div key={m._id} className="flex justify-between py-1.5 text-sm"><span>{titleCase(m.channel)} · {m.template.replace(/_/g, " ")}</span><span className="text-xs text-ink-muted">{m.status} · {dateTime(m.createdAt)}</span></div>)}
          </Panel>
          <Panel><PanelHeader title="Audit trail" hint="Append-only" />
            {d.audit.length === 0 ? <p className="text-sm text-ink-muted">Audit entries are visible to roles with audit:read.</p> : (
              <ul className="divide-y hairline text-sm">{d.audit.map((a) => <li key={a._id} className="flex flex-wrap justify-between gap-2 py-2"><span><span className="font-mono text-xs">{a.action}</span> <span className="text-ink-muted">by {a.actor}</span></span><span className="text-xs text-ink-muted">{dateTime(a.createdAt)}</span></li>)}</ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Panel strong>
            <PanelHeader title="Recommended action" />
            <p className="text-sm font-medium">{dec ? titleCase(dec.plan.decision) : "Pending"}</p>
            <p className="mt-1 text-xs text-ink-muted">{dec?.plan.reasoning_summary ?? dec?.plan.evidence?.[0] ?? "Awaiting Rhea."}</p>
            <div className="mt-4 hidden lg:block"><CaseActions d={d} /></div>
          </Panel>
          <Panel>
            <PanelHeader title="Summary" />
            <dl><KV k="Status" v={<StatusBadge status={c.status} />} /><KV k="Mode" v={c.autonomous === null ? "—" : c.autonomous ? "Autonomous" : "Human"} /><KV k="First response" v={ms(c.firstResponseMs)} />
              <KV k="Policy" v={<span className="font-mono text-xs">{dec?.policyEvaluation?.policy ?? "—"}</span>} /><KV k="Ticket" v={c.ticketId ?? "—"} mono /><KV k="Order" v={c.orderNumber ?? "—"} mono /></dl>
          </Panel>
          <Panel>
            <PanelHeader title="Risk factors" />
            {dec?.riskAssessment ? <ul className="space-y-1.5 text-sm">{dec.riskAssessment.factors.map((f) => <li key={f.name} className="flex justify-between gap-3"><span>{titleCase(f.name)}</span><span className="tabular text-ink-muted">+{f.weight.toFixed(2)}</span></li>)}<li className="flex justify-between border-t hairline pt-1.5 font-medium"><span>Total</span><span className="tabular">{dec.riskAssessment.riskScore.toFixed(2)} {dec.riskAssessment.riskLevel}</span></li></ul> : <p className="text-sm text-ink-muted">Not assessed yet.</p>}
          </Panel>
          {d.escalations[0] && (
            <Panel>
              <PanelHeader title="Escalation case file" hint="Complete handoff: no re-investigation needed" />
              <dl><KV k="Reason" v={titleCase(d.escalations[0].reason)} /><KV k="Status" v={d.escalations[0].status} />
                <KV k="Done by Rhea" v={d.escalations[0].caseFile.actionsPerformed.length ? d.escalations[0].caseFile.actionsPerformed.map((a) => a.tool).join(", ") : "Nothing executed"} />
                <KV k="Failed" v={d.escalations[0].caseFile.failedActions.length ? d.escalations[0].caseFile.failedActions.map((a) => a.tool).join(", ") : "None"} /></dl>
              <Link href={`/escalations/${d.escalations[0]._id}`} className="mt-2 inline-block text-xs font-medium text-burgundy-600 hover:underline">Open escalation →</Link>
            </Panel>
          )}
        </aside>
      </div>

      {hasNeedsHuman && (
        <div className="glass-strong fixed inset-x-0 bottom-0 z-30 rounded-t-2xl p-4 lg:hidden"><div className="mb-2 text-xs font-semibold text-burgundy-700">Action needed</div><CaseActions d={d} /></div>
      )}
    </div>
  );
}
