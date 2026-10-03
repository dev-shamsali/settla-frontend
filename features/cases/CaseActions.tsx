"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalsApi, escalationsApi } from "@/services";
import { useAppSelector } from "@/store";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import { FinancialConfirm, Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { inr, titleCase } from "@/lib/utils";
import type { CaseDetail } from "@/types/api";

type Pending = { kind: "approve" | "reject" | "refund" | "close" | "take_over" | "retry"; } | null;

/** Every outcome shown to the user is the backend's reported outcome. Nothing is assumed successful. */
export function CaseActions({ d }: { d: CaseDetail }) {
  const perms = useAppSelector((s) => s.auth.user?.permissions) ?? [];
  const toast = useToast();
  const qc = useQueryClient();
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState("");
  const [edit, setEdit] = useState(false);
  const [amount, setAmount] = useState("");
  const approval = d.approvals.find((a) => a.status === "PENDING");
  const esc = d.escalations.find((e) => e.status === "OPEN" || e.status === "IN_PROGRESS");
  const c = d.case;

  const done = (what: string, outcome?: string) => {
    const ok = outcome ? ["REFUNDED", "RESOLVED", "REJECTED", "CLOSED", "IN_PROGRESS", "DECIDING"].includes(outcome) : true;
    toast.push({ kind: ok ? "success" : "info", title: `${what}: ${outcome ? titleCase(outcome) : "done"}`, body: ok ? undefined : "Backend reported a non-final outcome. See timeline." });
    setPending(null); setEdit(false); setNote("");
    void qc.invalidateQueries({ queryKey: ["case", c._id] }); void qc.invalidateQueries({ queryKey: ["approvals"] }); void qc.invalidateQueries({ queryKey: ["escalations"] });
  };
  const fail = (e: Error) => toast.push({ kind: "error", title: "Action not completed", body: e.message });

  const decide = useMutation({
    mutationFn: (v: { decision: "approve" | "reject"; editedAmount?: number }) => approvalsApi.decide(approval!._id, { ...v, note: note || undefined }),
    onSuccess: (r) => done("Approval", r.outcome), onError: fail,
  });
  const act = useMutation({
    mutationFn: (v: { action: "take_over" | "retry" | "refund" | "close"; amount?: number }) => escalationsApi.act(esc!._id, { ...v, note: note || undefined }),
    onSuccess: (r) => done("Escalation", (r.status as string) ?? undefined), onError: fail,
  });

  const canApprove = perms.includes("approvals:approve") && !!approval;
  const canEsc = perms.includes("escalations:update") && !!esc;
  const canRefund = perms.includes("payments:refund") && !!esc;
  if (!approval && !esc) return <p className="text-sm text-ink-muted">{["RESOLVED", "REFUNDED", "CLOSED"].includes(c.status) ? "No action required. Case is complete." : "No human action is needed right now. Rhea is handling this case."}</p>;

  const kind = pending?.kind ?? null;
  const editedAmt = edit && amount ? Number(amount) : undefined;
  return (
    <div className="space-y-3">
      {approval && (
        <div className="space-y-2">
          <p className="text-sm">Rhea requests approval to <b>{titleCase(approval.decision)}</b> <b className="tabular">{inr(approval.amount)}</b>.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={!canApprove} onClick={() => setPending({ kind: "approve" })}>Approve</Button>
            <Button variant="outline" disabled={!canApprove} onClick={() => setPending({ kind: "reject" })}>Reject</Button>
            <Button variant="outline" disabled={!canApprove || approval.decision !== "REFUND"} onClick={() => setEdit(true)}>Edit amount</Button>
            <Button variant="ghost" disabled={!canEsc} onClick={() => setPending({ kind: "take_over" })}>Take over</Button>
          </div>
          {!canApprove && <p className="text-xs text-ink-muted">You do not have approvals:approve.</p>}
        </div>
      )}
      {esc && !approval && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!canEsc} onClick={() => setPending({ kind: "take_over" })}>Take over</Button>
          <Button variant="outline" disabled={!canEsc} onClick={() => setPending({ kind: "retry" })}>Retry</Button>
          <Button disabled={!canRefund} onClick={() => setPending({ kind: "refund" })}>Refund</Button>
          <Button variant="ghost" disabled={!canEsc} onClick={() => setPending({ kind: "close" })}>Close</Button>
          {!canRefund && <p className="col-span-2 text-xs text-ink-muted">Refund requires payments:refund.</p>}
        </div>
      )}

      <FinancialConfirm open={kind === "approve" || kind === "reject"} onClose={() => setPending(null)} danger={kind === "reject"}
        confirmLabel={kind === "reject" ? "Reject" : editedAmt ? "Approve edited amount" : "Approve refund"} loading={decide.isPending}
        onConfirm={() => decide.mutate({ decision: kind === "reject" ? "reject" : "approve", editedAmount: editedAmt })}
        rows={approval ? [
          { k: "Action", v: titleCase(approval.decision) }, { k: "Amount", v: inr(editedAmt ?? approval.amount) }, { k: "Payment", v: <span className="font-mono">{approval.paymentId}</span> },
          { k: "Customer", v: approval.customerName ?? "—" }, { k: "Reason", v: approval.reason }, { k: "Policy", v: approval.policy?.policy ?? "—" },
          { k: "Risk", v: `${approval.risk.level} · ${approval.risk.score}` }, { k: "Approval", v: "REQUIRED" },
        ] : []}
      />
      <FinancialConfirm open={kind === "refund"} onClose={() => setPending(null)} confirmLabel="Refund" danger loading={act.isPending}
        onConfirm={() => act.mutate({ action: "refund" })}
        rows={[{ k: "Action", v: "Refund (full remaining balance)" }, { k: "Payment", v: <span className="font-mono">{c.paymentId}</span> }, { k: "Customer", v: c.customerName ?? "—" }, { k: "Amount (gateway re-checked)", v: inr(c.amount) }, { k: "Risk", v: c.risk ? `${c.risk.level} · ${c.risk.score}` : "—" }, { k: "Approval", v: "Your permission is checked by the backend" }]} />
      <Dialog open={kind === "take_over" || kind === "retry" || kind === "close"} onClose={() => setPending(null)} title={kind ? titleCase(kind) : ""}
        footer={<><Button variant="outline" onClick={() => setPending(null)}>Cancel</Button><Button loading={act.isPending} onClick={() => act.mutate({ action: kind === "retry" ? "retry" : kind === "close" ? "close" : "take_over" })}>Confirm</Button></>}>
        <Field label="Note (audited)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
      </Dialog>
      <Dialog open={edit} onClose={() => setEdit(false)} title="Edit approved amount"
        footer={<><Button variant="outline" onClick={() => setEdit(false)}>Cancel</Button><Button disabled={!amount || Number(amount) <= 0 || Number(amount) > (approval?.amount ?? 0)} onClick={() => { setEdit(false); setPending({ kind: "approve" }); }}>Continue</Button></>}>
        <Field label={`Refund amount (max ${inr(approval?.amount)})`}><Input type="number" min={1} max={approval?.amount} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      </Dialog>
    </div>
  );
}
