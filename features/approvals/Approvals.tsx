"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import { approvalsApi } from "@/services";
import { useAppSelector } from "@/store";
import { Badge, Button, EmptyState, ErrorState, PageHeader, Panel, RiskBadge, Select, SkeletonRows } from "@/components/ui/primitives";
import { FinancialConfirm } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ago, inr, titleCase } from "@/lib/utils";
import type { Approval } from "@/types/api";

export function Approvals() {
  const [status, setStatus] = useState("PENDING");
  const [target, setTarget] = useState<{ a: Approval; kind: "approve" | "reject" } | null>(null);
  const canApprove = useAppSelector((s) => s.auth.user?.permissions.includes("approvals:approve"));
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["approvals", status], queryFn: () => approvalsApi.list({ status, pageSize: 50 }) });
  const m = useMutation({
    mutationFn: () => approvalsApi.decide(target!.a._id, { decision: target!.kind }),
    onSuccess: (r) => { toast.push({ kind: ["REFUNDED", "RESOLVED", "REJECTED"].includes(r.outcome) ? "success" : "info", title: `Approval ${target?.kind}d → ${titleCase(r.outcome)}` }); setTarget(null); void qc.invalidateQueries(); },
    onError: (e: Error) => { toast.push({ kind: "error", title: "Not completed", body: e.message }); setTarget(null); },
  });
  return (
    <div>
      <PageHeader title="Approvals" subtitle="Sensitive actions that policy says a human must authorise. Approvals are audited and cannot be self-approved." actions={<Select aria-label="Status" className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></Select>} />
      {q.isLoading ? <SkeletonRows rows={3} /> : q.error ? <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel> : !q.data?.items.length ? (
        <Panel><EmptyState icon={<CheckSquare className="h-5 w-5" />} title={status === "PENDING" ? "Nothing waiting for approval" : "No approvals here"} body="Refunds above the auto-execution limit and other policy exceptions appear here for a finance or admin decision." /></Panel>
      ) : (
        <div className="space-y-4">
          {q.data.items.map((a) => (
            <Panel key={a._id} strong={a.status === "PENDING"}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2"><Link href={`/cases/${a.caseId}`} className="font-mono text-xs font-semibold text-burgundy-700 hover:underline">{a.caseNumber}</Link><Badge tone={a.status === "PENDING" ? "warn" : a.status === "APPROVED" ? "ok" : "bad"}>{a.status}</Badge><RiskBadge level={a.risk.level} score={a.risk.score} /></div>
                  <h2 className="font-display text-2xl">{titleCase(a.decision)} <span className="tabular">{inr(a.amount)}</span></h2>
                  <p className="text-sm text-ink-soft">{a.reason}</p>
                </div>
                {a.status === "PENDING" && (
                  <div className="flex gap-2"><Button disabled={!canApprove} onClick={() => setTarget({ a, kind: "approve" })}>Approve</Button><Button variant="outline" disabled={!canApprove} onClick={() => setTarget({ a, kind: "reject" })}>Reject</Button></div>
                )}
              </div>
              <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="eyebrow">Customer</dt><dd>{a.customerName ?? "—"}</dd></div><div><dt className="eyebrow">Payment</dt><dd className="font-mono text-xs">{a.paymentId}</dd></div>
                <div><dt className="eyebrow">Policy</dt><dd className="font-mono text-xs">{a.policy?.policy ?? "—"}</dd></div><div><dt className="eyebrow">Requested</dt><dd>{a.requestedBy} · {ago(a.requestedAt)}</dd></div>
              </dl>
              {a.evidence?.length > 0 && <ul className="mt-3 list-inside list-disc text-xs text-ink-muted">{a.evidence.slice(0, 5).map((e) => <li key={e}>{e}</li>)}</ul>}
              {a.decidedBy && <p className="mt-3 text-xs text-ink-muted">Decided by {a.decidedBy}{a.note ? `: ${a.note}` : ""}</p>}
            </Panel>
          ))}
        </div>
      )}
      <FinancialConfirm open={!!target} onClose={() => setTarget(null)} confirmLabel={target?.kind === "approve" ? "Approve & execute" : "Reject"} danger={target?.kind === "reject"} loading={m.isPending} onConfirm={() => m.mutate()}
        rows={target ? [{ k: "Action", v: titleCase(target.a.decision) }, { k: "Amount", v: inr(target.a.amount) }, { k: "Payment", v: <span className="font-mono">{target.a.paymentId}</span> }, { k: "Customer", v: target.a.customerName ?? "—" }, { k: "Reason", v: target.a.reason }, { k: "Policy", v: target.a.policy?.policy ?? "—" }, { k: "Risk", v: `${target.a.risk.level} · ${target.a.risk.score}` }, { k: "Approval", v: "REQUIRED" }] : []} />
    </div>
  );
}
