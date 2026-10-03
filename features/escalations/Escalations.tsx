"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Siren } from "lucide-react";
import { escalationsApi } from "@/services";
import { useAppSelector } from "@/store";
import { DataTable, type Col } from "@/components/ui/DataTable";
import { Badge, Button, ErrorState, KV, PageHeader, Panel, PanelHeader, RiskBadge, Select, Skeleton } from "@/components/ui/primitives";
import { FinancialConfirm } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ago, inr, titleCase } from "@/lib/utils";
import type { Escalation } from "@/types/api";

export function EscalationsList() {
  const router = useRouter();
  const [status, setStatus] = useState("OPEN");
  const q = useQuery({ queryKey: ["escalations", status], queryFn: () => escalationsApi.list({ status, pageSize: 50 }) });
  const cols: Col<Escalation>[] = [
    { key: "c", header: "Case", cell: (r) => <span className="font-mono text-xs font-semibold">{r.caseNumber}</span> },
    { key: "r", header: "Reason", cell: (r) => <Badge tone="warn">{titleCase(r.reason)}</Badge> },
    { key: "a", header: "Amount", cell: (r) => <span className="tabular font-medium">{inr(r.amount)}</span> },
    { key: "k", header: "Risk", hideBelow: "md", cell: (r) => <RiskBadge level={r.risk?.level} score={r.risk?.score} /> },
    { key: "s", header: "Status", cell: (r) => <Badge tone={r.status === "OPEN" ? "warn" : "neutral"}>{r.status}</Badge> },
    { key: "o", header: "Assigned", hideBelow: "lg", cell: (r) => r.assignedTo ?? "—" },
    { key: "t", header: "Opened", cell: (r) => <span className="text-xs text-ink-muted">{ago(r.createdAt)}</span> },
  ];
  return (
    <div>
      <PageHeader title="Escalations" subtitle="Cases Rhea handed to a human, each with the complete case file so nobody starts over." actions={<Select aria-label="Status" className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>{["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</Select>} />
      <Panel><DataTable cols={cols} rows={q.data?.items} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} onRowClick={(r) => router.push(`/escalations/${r._id}`)}
        empty={{ icon: <Siren className="h-5 w-5" />, title: "No escalations", body: "Rhea escalates low-confidence, high-value, legal, chargeback or failed cases here. Nothing needs a human right now." }} /></Panel>
    </div>
  );
}

export function EscalationDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["escalations", "one", id], queryFn: () => escalationsApi.get(id) });
  const perms = useAppSelector((s) => s.auth.user?.permissions) ?? [];
  const toast = useToast();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<null | "refund">(null);
  const act = useMutation({
    mutationFn: (v: { action: "take_over" | "retry" | "refund" | "close"; amount?: number }) => escalationsApi.act(id, v),
    onSuccess: (r, v) => { toast.push({ kind: "success", title: `${titleCase(v.action)}: ${titleCase(String(r.status ?? "done"))}` }); setConfirm(null); void qc.invalidateQueries(); },
    onError: (e: Error) => { toast.push({ kind: "error", title: "Not completed", body: e.message }); setConfirm(null); },
  });
  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const e = q.data, f = e.caseFile;
  const can = perms.includes("escalations:update"), canRefund = perms.includes("payments:refund");
  return (
    <div>
      <PageHeader title={`Escalation · ${e.caseNumber}`} subtitle={`${titleCase(e.reason)} · opened ${ago(e.createdAt)}`} actions={<Link href={`/cases/${e.caseId}`}><Button variant="outline">Open case</Button></Link>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel strong><PanelHeader title="Case file" hint="Everything Rhea already established" />
            <div className="grid gap-x-8 sm:grid-cols-2"><dl><KV k="Customer" v={f.customer.name ?? "—"} /><KV k="Payment" v={f.payment.id} mono /><KV k="Amount" v={inr(f.payment.amount)} /><KV k="Risk" v={<RiskBadge level={f.risk?.level} score={f.risk?.score} />} /></dl>
              <dl><KV k="Policy" v={f.policy ? `${f.policy.policy} · ${f.policy.passed ? "passed" : "not passed"}` : "—"} /><KV k="Recommended" v={f.recommendedAction ? titleCase(f.recommendedAction) : "—"} /><KV k="Status" v={e.status} /><KV k="Assigned" v={e.assignedTo ?? "—"} /></dl></div>
          </Panel>
          <Panel><PanelHeader title="Evidence" />{f.evidence.length ? <ul className="list-inside list-disc space-y-1 text-sm">{f.evidence.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-sm text-ink-muted">No structured evidence was captured for this escalation reason.</p>}{f.reasoningSummary && <p className="mt-3 text-sm text-ink-soft">{f.reasoningSummary}</p>}</Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <Panel><PanelHeader title="Already performed by Rhea" />{f.actionsPerformed.length ? <ul className="space-y-1 text-sm">{f.actionsPerformed.map((a, i) => <li key={i} className="flex justify-between"><span className="font-mono text-xs">{a.tool}</span><Badge tone="ok">{a.state}</Badge></li>)}</ul> : <p className="text-sm text-ink-muted">Nothing was executed.</p>}</Panel>
            <Panel><PanelHeader title="Failed actions" />{f.failedActions.length ? <ul className="space-y-1 text-sm">{f.failedActions.map((a, i) => <li key={i}><span className="font-mono text-xs">{a.tool}</span> <Badge tone="bad">{a.state}</Badge>{a.error && <div className="text-xs text-bad">{a.error.message}</div>}</li>)}</ul> : <p className="text-sm text-ink-muted">None.</p>}</Panel>
          </div>
        </div>
        <aside><Panel className="lg:sticky lg:top-20"><PanelHeader title="Actions" hint="Outcomes come from the backend" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={!can || act.isPending} onClick={() => act.mutate({ action: "take_over" })}>Take over</Button>
            <Button variant="outline" disabled={!can || act.isPending} onClick={() => act.mutate({ action: "retry" })}>Retry</Button>
            <Button disabled={!canRefund || act.isPending} onClick={() => setConfirm("refund")}>Refund</Button>
            <Button variant="ghost" disabled={!can || act.isPending} onClick={() => act.mutate({ action: "close" })}>Close</Button>
          </div>
          {!canRefund && <p className="mt-3 text-xs text-ink-muted">Refund requires payments:refund.</p>}
        </Panel></aside>
      </div>
      <FinancialConfirm open={confirm === "refund"} onClose={() => setConfirm(null)} confirmLabel="Refund" danger loading={act.isPending} onConfirm={() => act.mutate({ action: "refund" })}
        rows={[{ k: "Action", v: "Refund remaining balance" }, { k: "Payment", v: <span className="font-mono">{f.payment.id}</span> }, { k: "Customer", v: f.customer.name ?? "—" }, { k: "Amount (gateway re-checked)", v: inr(f.payment.amount) }, { k: "Reason", v: titleCase(e.reason) }, { k: "Risk", v: f.risk ? `${f.risk.level} · ${f.risk.score}` : "—" }]} />
    </div>
  );
}
