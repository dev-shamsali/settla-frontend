"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { automationApi } from "@/services";
import { useAppSelector } from "@/store";
import { Badge, Button, ErrorState, KV, PanelHeader, Skeleton } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/services/apiClient";
import { dateTime, inr, titleCase } from "@/lib/utils";
import type { AutomationRun } from "@/types/api";

const tone = (s: AutomationRun["status"]) => (s === "SUCCEEDED" ? "ok" : s === "BLOCKED" ? "warn" : s === "DISPATCHED" ? "info" : "bad");

/** Rhea proposes, the backend decides, n8n executes. Outcomes shown are exactly what the backend reports. */
export function AutomationPanel({ caseId }: { caseId: string }) {
  const perms = useAppSelector((s) => s.auth.user?.permissions) ?? [];
  const canRead = perms.includes("automation:read");
  const canDispatch = perms.includes("automation:dispatch");
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState<string>("");
  const proposal = useQuery({ queryKey: ["case", caseId, "automation-proposal"], queryFn: () => automationApi.proposal(caseId), enabled: canRead });
  const runs = useQuery({ queryKey: ["case", caseId, "automation"], queryFn: () => automationApi.runs(caseId), enabled: canRead });

  const dispatch = useMutation({
    mutationFn: () => automationApi.dispatch(caseId, proposal.data!.proposal, key),
    onSuccess: (r) => {
      toast.push({ kind: r.status === "SUCCEEDED" ? "success" : "info", title: `n8n ${titleCase(r.status)}`, body: `Correlation ${r.correlationId}${r.idempotentReplay ? " · replayed, not re-executed" : ""}` });
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: (e: Error) => {
      const code = e instanceof ApiError ? e.code : "ERROR";
      toast.push({ kind: "error", title: `Backend refused: ${code}`, body: e.message });
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["case", caseId] });
    },
  });

  if (!canRead) return <p className="text-sm text-ink-muted">Automation history is visible to roles with automation:read.</p>;
  const p = proposal.data;
  const verdict = p?.backendDecision;
  return (
    <div>
      <PanelHeader title="Automation (n8n)" hint="Rhea proposes · the backend decides · n8n executes approved, non-financial steps" />
      {proposal.isLoading ? <Skeleton className="h-24" /> : proposal.error ? <ErrorState error={proposal.error} onRetry={() => proposal.refetch()} /> : p && verdict && (
        <div className="rounded-xl border hairline bg-white/[0.05] p-4">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <dl><KV k="Rhea proposes" v={<span className="font-mono text-xs">{p.proposal.action}</span>} /><KV k="Proposed risk" v={p.proposal.riskLevel.toUpperCase()} /><KV k="Rhea says approval needed" v={p.proposal.requiresHumanApproval ? "Yes" : "No"} /></dl>
            <dl><KV k="Backend verdict" v={<Badge tone={verdict.allowed ? "ok" : "warn"}>{verdict.allowed ? "Allowed" : titleCase(verdict.code)}</Badge>} /><KV k="Backend risk" v={`${verdict.backend.riskLevel} · ${verdict.backend.riskScore.toFixed(2)}`} />
              <KV k="Human approval" v={verdict.backend.requiresApproval ? `Required for side effects (> ${inr(verdict.backend.autoLimit)})` : "Not required"} /></dl>
          </div>
          {verdict.reasons.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-ink-muted">{verdict.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" disabled={!canDispatch || !verdict.allowed} onClick={() => { setKey(crypto.randomUUID()); setOpen(true); }}>Run investigation step</Button>
            {!canDispatch && <span className="text-xs text-ink-muted">Requires automation:dispatch.</span>}
            {canDispatch && !verdict.allowed && <span className="text-xs text-warn">Blocked by backend policy: nothing can be dispatched.</span>}
          </div>
        </div>
      )}

      <h3 className="eyebrow mb-2 mt-5">Dispatch history</h3>
      {runs.isLoading ? <Skeleton className="h-16" /> : !runs.data?.length ? <p className="text-sm text-ink-muted">No n8n runs for this case yet.</p> : (
        <ul className="divide-y hairline">
          {runs.data.map((r) => (
            <li key={r._id} className="py-2.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2"><span className="font-mono text-xs">{r.requestedAction}</span><Badge tone={tone(r.status)}>{titleCase(r.status)}</Badge>{r.verification && <span className="text-xs text-ink-muted">{r.verification.checks.filter((c) => c.passed).length}/{r.verification.checks.length} checks</span>}</span>
                <span className="text-xs text-ink-muted">{dateTime(r.createdAt)}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-4 text-[11px] text-ink-muted"><span>corr <span className="font-mono">{r.correlationId}</span></span>{r.n8nExecutionId && <span>n8n exec <span className="font-mono">{r.n8nExecutionId}</span></span>}{r.externalService && <span>{titleCase(r.externalService)}</span>}<span>by {r.actor}</span></div>
              {(r.error || r.status === "BLOCKED") && <div className="mt-1 text-xs text-bad">{r.error?.message ?? r.backendDecision.reasons.at(-1)}</div>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Run investigation step"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={dispatch.isPending} onClick={() => dispatch.mutate()}>Send to n8n</Button></>}>
        <dl className="divide-y hairline rounded-xl border hairline bg-white/[0.05] px-4 text-sm">
          <div className="flex justify-between py-2.5"><dt className="text-ink-muted">Step</dt><dd className="font-mono text-xs">{p?.proposal.action}</dd></div>
          <div className="flex justify-between py-2.5"><dt className="text-ink-muted">Type</dt><dd>Read-only investigation (no money moves)</dd></div>
          <div className="flex justify-between py-2.5"><dt className="text-ink-muted">Executed by</dt><dd>n8n · SETTLA - PAYMENT RESOLUTION</dd></div>
          <div className="flex justify-between py-2.5"><dt className="text-ink-muted">Backend verdict</dt><dd>{verdict?.allowed ? "Allowed" : verdict?.code}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-ink-muted">The backend re-validates this request, signs it, applies idempotency and records an audit entry. Integrations are in test mode: no external service is contacted and no message is sent.</p>
      </Dialog>
    </div>
  );
}
