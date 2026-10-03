"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useAppDispatch, useAppSelector, authActions } from "@/store";
import { tenantApi } from "@/services";
import { Dialog } from "@/components/ui/Dialog";
import { Badge, Button, Select, Field, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import type { ExecutionMode } from "@/types/api";

const MODES: { v: ExecutionMode; label: string; desc: string }[] = [
  { v: "AUTONOMOUS", label: "Autonomous", desc: "Rhea investigates and executes within policy and limits." },
  { v: "RECOMMEND_ONLY", label: "Recommend only", desc: "Rhea investigates and recommends. Sensitive actions are not executed." },
  { v: "DISABLED", label: "Disabled", desc: "Rhea does nothing. Every case is escalated to a human." },
];

/** Kill switch: visible to everyone, changeable only with tenant:write. */
export function ModeSwitch() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.auth.tenant?.executionMode);
  const canWrite = useAppSelector((s) => s.auth.user?.permissions.includes("tenant:write"));
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<ExecutionMode>("RECOMMEND_ONLY");
  const [reason, setReason] = useState("");
  const m = useMutation({
    mutationFn: () => tenantApi.setMode(next, reason || undefined),
    onSuccess: (r) => { dispatch(authActions.modeChanged(r.executionMode)); toast.push({ kind: "success", title: `Execution mode: ${r.executionMode}` }); setOpen(false); },
    onError: (e: Error) => toast.push({ kind: "error", title: "Could not change mode", body: e.message }),
  });
  const tone = mode === "AUTONOMOUS" ? "ok" : mode === "RECOMMEND_ONLY" ? "warn" : "bad";
  return (
    <>
      <button onClick={() => canWrite && (setNext(mode === "AUTONOMOUS" ? "RECOMMEND_ONLY" : "AUTONOMOUS"), setOpen(true))} disabled={!canWrite} aria-label={`Rhea execution mode: ${mode}`} className="hidden sm:block disabled:cursor-default">
        <Badge tone={tone} dot className="pulse-dot">{mode === "AUTONOMOUS" ? "Autonomous" : mode === "RECOMMEND_ONLY" ? "Recommend only" : "Disabled"}</Badge>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Rhea execution mode"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant={next === "AUTONOMOUS" ? "primary" : "danger"} loading={m.isPending} onClick={() => m.mutate()}>Apply</Button></>}>
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-warn-bg p-3 text-xs text-warn"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />Takes effect immediately for all new actions in this tenant and is written to the audit log.</div>
        <div className="space-y-4">
          <Field label="Mode" htmlFor="mode"><Select id="mode" value={next} onChange={(e) => setNext(e.target.value as ExecutionMode)}>{MODES.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}</Select></Field>
          <p className="text-xs text-ink-muted">{MODES.find((x) => x.v === next)?.desc}</p>
          <Field label="Reason (audited)" htmlFor="reason"><Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Gateway incident" /></Field>
        </div>
      </Dialog>
    </>
  );
}
