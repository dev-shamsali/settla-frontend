"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BookOpen, GitBranch } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { analyticsApi, auditApi, decisionsApi, integrationsApi, knowledgeApi, policiesApi } from "@/services";
import { useAppSelector } from "@/store";
import { DataTable, type Col } from "@/components/ui/DataTable";
import { Badge, Button, EmptyState, ErrorState, Input, KV, PageHeader, Panel, PanelHeader, Select, Skeleton, Stat, StatusBadge, SkeletonRows } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { TraceView, PolicyChecks } from "@/features/cases/CaseParts";
import { ago, dateTime, inr, ms, titleCase } from "@/lib/utils";
import type { AuditLog, Trace } from "@/types/api";

/* ---------- Decision traces ---------- */
export function TracesList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ["traces", page], queryFn: () => decisionsApi.list({ page, pageSize: 20 }) });
  const cols: Col<Trace>[] = [
    { key: "c", header: "Case", cell: (r) => <span className="font-mono text-xs font-semibold">{r.caseNumber}</span> },
    { key: "p", header: "Proposal", cell: (r) => titleCase(r.proposal) }, { key: "a", header: "Amount", cell: (r) => <span className="tabular">{inr(r.amount)}</span> },
    { key: "po", header: "Policy", hideBelow: "md", cell: (r) => <span className="font-mono text-xs">{r.policy}</span> }, { key: "r", header: "Risk", hideBelow: "md", cell: (r) => r.risk },
    { key: "v", header: "Verification", cell: (r) => <Badge tone={r.verification === "PASSED" ? "ok" : r.verification === "FAILED" ? "bad" : "neutral"}>{r.verification}</Badge> },
    { key: "f", header: "Final", cell: (r) => <StatusBadge status={r.final} /> }, { key: "t", header: "When", hideBelow: "lg", cell: (r) => <span className="text-xs text-ink-muted">{ago(r.createdAt)}</span> },
  ];
  return <div><PageHeader title="Decision traces" subtitle="Proposal → rules → policy → risk → permission → execution → verification, for every decision Rhea makes." /><Panel><DataTable cols={cols} rows={q.data?.items} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} onRowClick={(r) => router.push(`/decision-traces/${r._id}`)} page={q.data?.page} totalPages={q.data?.totalPages} total={q.data?.total} onPage={setPage} empty={{ icon: <GitBranch className="h-5 w-5" />, title: "No decisions yet", body: "Every Rhea decision is recorded here with the exact rules, policy and checks behind it." }} /></Panel></div>;
}
export function TraceDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["trace", id], queryFn: () => decisionsApi.get(id) });
  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const { trace, decision } = q.data;
  return (
    <div><PageHeader title={`Trace · ${trace.caseNumber}`} actions={<Link href={`/cases/${trace.caseId}`}><Button variant="outline">Open case</Button></Link>} />
      <div className="grid gap-5 lg:grid-cols-2"><Panel strong><PanelHeader title="Decision trace" /><TraceView t={trace} /></Panel><Panel><PanelHeader title="Policy evaluation" /><PolicyChecks policy={decision?.policyEvaluation} /></Panel>
        <Panel className="lg:col-span-2"><PanelHeader title="AI proposal vs enforced plan" hint="Hard rules may tighten the proposal but never widen it" />
          <div className="grid gap-6 md:grid-cols-2"><div><div className="eyebrow mb-1">Proposed (validated JSON schema)</div><pre className="max-h-72 overflow-auto rounded-lg bg-white/[0.05] p-3 font-mono text-[11px]">{JSON.stringify(decision?.proposedPlan, null, 2)}</pre></div><div><div className="eyebrow mb-1">Enforced</div><pre className="max-h-72 overflow-auto rounded-lg bg-white/[0.05] p-3 font-mono text-[11px]">{JSON.stringify(decision?.plan, null, 2)}</pre></div></div></Panel></div></div>
  );
}

/* ---------- Activity / audit ---------- */
export function ActivityLog({ title = "Activity & audit" }: { title?: string }) {
  const [page, setPage] = useState(1); const [action, setAction] = useState("");
  const q = useQuery({ queryKey: ["audit", page, action], queryFn: () => auditApi.list({ page, pageSize: 25, action }) });
  const [open, setOpen] = useState<AuditLog | null>(null);
  const cols: Col<AuditLog>[] = [
    { key: "t", header: "Time", cell: (r) => <span className="text-xs text-ink-muted">{dateTime(r.createdAt)}</span> }, { key: "a", header: "Action", cell: (r) => <span className="font-mono text-xs">{r.action}</span> },
    { key: "r", header: "Resource", hideBelow: "md", cell: (r) => <span className="text-xs">{r.resourceType} <span className="font-mono text-ink-muted">{r.resourceId?.slice(0, 10)}</span></span> },
    { key: "by", header: "Actor", cell: (r) => <span className="text-xs">{r.actor} <Badge>{r.actorType}</Badge></span> }, { key: "tr", header: "Trace", hideBelow: "lg", cell: (r) => <span className="font-mono text-[11px] text-ink-muted">{r.traceId?.slice(0, 8)}</span> },
  ];
  return (
    <div><PageHeader title={title} subtitle="Append-only record of every sensitive change. Secrets are never stored." actions={<Input aria-label="Filter by action" className="w-56" placeholder="Filter action e.g. case.create" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} />} />
      <Panel><DataTable cols={cols} rows={q.data?.items} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} onRowClick={setOpen} page={q.data?.page} totalPages={q.data?.totalPages} total={q.data?.total} onPage={setPage} empty={{ icon: <Activity className="h-5 w-5" />, title: "No audit entries", body: "Actions taken by people and by Rhea are recorded here." }} /></Panel>
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.action ?? ""} drawer>{open && <><dl><KV k="Actor" v={`${open.actor} (${open.actorType})`} /><KV k="Resource" v={`${open.resourceType} ${open.resourceId ?? ""}`} /><KV k="IP" v={open.ip ?? "—"} /><KV k="Trace" v={open.traceId ?? "—"} mono /></dl>{open.before !== undefined && <><div className="eyebrow mt-3">Before</div><pre className="mt-1 overflow-auto rounded bg-white/[0.05] p-2 text-[11px]">{JSON.stringify(open.before, null, 2)}</pre></>}{open.after !== undefined && <><div className="eyebrow mt-3">After</div><pre className="mt-1 overflow-auto rounded bg-white/[0.05] p-2 text-[11px]">{JSON.stringify(open.after, null, 2)}</pre></>}</>}</Dialog>
    </div>
  );
}

/* ---------- Policies ---------- */
export function PoliciesList() {
  const q = useQuery({ queryKey: ["policies"], queryFn: policiesApi.list });
  return (
    <div><PageHeader title="Policies" subtitle="Versioned, auditable rules that gate every action. Rhea cannot act outside them." />
      {q.isLoading ? <SkeletonRows rows={2} /> : q.error ? <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel> : (
        <div className="grid gap-5 md:grid-cols-2">{q.data?.map((p) => (
          <Link key={p.id} href={`/policies/${p.id}`}><Panel className="h-full transition-shadow hover:shadow-lg"><div className="flex items-center justify-between"><h2 className="font-mono text-sm font-semibold">{p.id}</h2><Badge tone="brand">{p.rules.length} rules</Badge></div><p className="mt-2 text-sm text-ink-soft">{p.description}</p></Panel></Link>))}</div>
      )}
    </div>
  );
}
export function PolicyDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["policy", id], queryFn: () => policiesApi.get(id) });
  if (q.isLoading) return <Skeleton className="h-72" />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const p = q.data;
  return <div><PageHeader title={p.id} subtitle={p.description} /><Panel><PanelHeader title="Rules" hint="Blocking rules stop execution. Approval rules route to a human." /><ul className="divide-y hairline">{p.rules.map((r) => <li key={r.id} className="flex items-center justify-between gap-4 py-2.5 text-sm"><span>{r.description}<span className="ml-2 font-mono text-[11px] text-ink-muted">{r.id}</span></span><Badge tone={r.severity === "block" ? "bad" : "warn"}>{r.severity === "block" ? "Blocks" : "Needs approval"}</Badge></li>)}</ul></Panel><p className="mt-3 text-xs text-ink-muted">Policies are code-versioned. Editing requires policies:write and a new version (not available in this release).</p></div>;
}

/* ---------- Knowledge base ---------- */
export function KnowledgeBase() {
  const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const docs = useQuery({ queryKey: ["knowledge"], queryFn: knowledgeApi.list });
  const hits = useQuery({ queryKey: ["knowledge-search", dq], queryFn: () => knowledgeApi.search(dq), enabled: dq.length > 1 });
  return (
    <div><PageHeader title="Knowledge base" subtitle="Policies, procedures and resolution rules Rhea retrieves from. Read-only to Rhea." />
      <Panel className="mb-5"><form onSubmit={(e) => { e.preventDefault(); setDq(q.trim()); }} className="flex gap-2"><Input aria-label="Search knowledge" placeholder="e.g. refund limit" value={q} onChange={(e) => setQ(e.target.value)} /><Button type="submit">Search</Button></form>
        {hits.data && <ul className="mt-4 space-y-3">{hits.data.slice(0, 5).map((h) => <li key={h.docId + h.text.slice(0, 8)} className="rounded-lg bg-white/[0.05] p-3 text-sm"><div className="mb-1 flex items-center gap-2"><b>{h.title}</b><Badge>{titleCase(h.kind)}</Badge><span className="text-[11px] text-ink-muted">score {h.score}</span></div><p className="text-ink-soft">{h.text}</p></li>)}</ul>}</Panel>
      {docs.isLoading ? <SkeletonRows rows={3} /> : !docs.data?.length ? <Panel><EmptyState icon={<BookOpen className="h-5 w-5" />} title="No documents yet" body="Add policies and procedures so Rhea can ground decisions in your rules." /></Panel> : <Panel><PanelHeader title="Documents" /><ul className="divide-y hairline">{docs.data.map((d) => <li key={d._id} className="flex justify-between py-2.5 text-sm"><span>{d.title}</span><Badge>{titleCase(d.kind)}</Badge></li>)}</ul></Panel>}
    </div>
  );
}

/* ---------- Analytics ---------- */
export function Analytics() {
  const [days, setDays] = useState(30);
  const s = useQuery({ queryKey: ["summary", "full", days], queryFn: () => analyticsApi.summary(days) });
  const t = useQuery({ queryKey: ["series", days], queryFn: () => analyticsApi.series(Math.min(days, 90)) });
  const axis = { stroke: "#8f8f8f", fontSize: 11, tickLine: false, axisLine: false } as const;
  return (
    <div><PageHeader title="Analytics" subtitle="Outcomes, speed and money. Only measured values; nothing is estimated except where labelled." actions={<Select aria-label="Window" className="w-36" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}</Select>} />
      {s.error ? <Panel><ErrorState error={s.error} onRetry={() => s.refetch()} /></Panel> : s.data && (
        <>
          <Panel strong className="mb-5"><div className="grid grid-cols-2 gap-6 md:grid-cols-4"><Stat label="Cases" value={s.data.casesTotal} /><Stat label="Autonomous rate" value={`${s.data.autonomousResolutionRate}%`} tone="ok" /><Stat label="Avg resolution" value={ms(s.data.avgResolutionMs)} /><Stat label="Recovered" value={inr(s.data.recoveredRevenue)} tone="ok" /><Stat label="Refunded" value={inr(s.data.refundedRevenue)} /><Stat label="Escalations" value={s.data.escalations} /><Stat label="Failed actions" value={s.data.failedActions} /><Stat label="Hours saved" value={s.data.agentHoursSaved} sub="est. 12 min / autonomous case" /></div></Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <Panel><PanelHeader title="Cases per day" /><div className="h-56"><ResponsiveContainer><BarChart data={t.data ?? []}><CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="date" tickFormatter={(x: string) => x.slice(5)} {...axis} /><YAxis {...axis} width={30} allowDecimals={false} /><Tooltip /><Bar dataKey="cases" fill="#d0606f" radius={[4, 4, 0, 0]} /><Bar dataKey="autonomous" fill="#7a3a45" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
            <Panel><PanelHeader title="Avg resolution (s)" /><div className="h-56"><ResponsiveContainer><LineChart data={(t.data ?? []).map((p) => ({ ...p, sec: Math.round(p.avgResolutionMs / 1000) }))}><CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="date" tickFormatter={(x: string) => x.slice(5)} {...axis} /><YAxis {...axis} width={30} /><Tooltip /><Line dataKey="sec" stroke="#d0606f" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></Panel>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Integrations ---------- */
const INTEGRATION_LABELS: Record<string, string> = { razorpay: "Razorpay · payments", shopify: "Shopify · orders / OMS", freshdesk: "Freshdesk · tickets", hubspot: "HubSpot · CRM", whatsapp: "WhatsApp · messaging", slack: "Slack · escalations", email: "Email · notifications" };
export function Integrations() {
  const q = useQuery({ queryKey: ["integrations"], queryFn: integrationsApi.list });
  const canWrite = useAppSelector((s) => s.auth.user?.permissions.includes("integrations:write"));
  const toast = useToast(); const qc = useQueryClient();
  const [secret, setSecret] = useState<{ type: string; keyId?: string; webhookSecret?: string } | null>(null);
  const byType = Object.fromEntries((q.data ?? []).map((i) => [i.type, i]));
  const test = useMutation({ mutationFn: (t: string) => integrationsApi.test(t), onSuccess: (r, t) => { toast.push({ kind: r.ok ? "success" : "error", title: `${titleCase(t)}: ${r.ok ? "reachable" : "check failed"}`, body: r.message }); void qc.invalidateQueries({ queryKey: ["integrations"] }); } });
  const setup = useMutation({ mutationFn: (t: string) => integrationsApi.put(t, { mode: "mock", enabled: true }), onSuccess: (r) => { if (r.webhookSecret) setSecret(r); void qc.invalidateQueries({ queryKey: ["integrations"] }); }, onError: (e: Error) => toast.push({ kind: "error", title: "Failed", body: e.message }) });
  return (
    <div><PageHeader title="Integrations" subtitle="Vendor adapters behind one interface. Credentials are encrypted at rest and never returned to the browser." />
      {q.isLoading ? <SkeletonRows rows={4} /> : q.error ? <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Object.keys(INTEGRATION_LABELS).map((t) => { const i = byType[t]; return (
          <Panel key={t}><div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold">{INTEGRATION_LABELS[t]}</h2><p className="mt-1 text-xs text-ink-muted">{i ? `Mode: ${i.mode}${i.configured ? " · credentials set" : ""}` : "Not set up"}</p></div><Badge tone={i?.enabled ? "ok" : "neutral"} dot>{i?.enabled ? "Enabled" : "Off"}</Badge></div>
            {i?.lastTest && <p className={`mt-2 text-xs ${i.lastTest.ok ? "text-ok" : "text-bad"}`}>Last test {i.lastTest.ok ? "passed" : "failed"} · {ago(i.lastTest.at)}</p>}
            <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" disabled={!canWrite || !i} loading={test.isPending && test.variables === t} onClick={() => test.mutate(t)}>Test</Button>{!i && <Button size="sm" disabled={!canWrite} loading={setup.isPending && setup.variables === t} onClick={() => setup.mutate(t)}>Set up (mock)</Button>}</div></Panel>); })}</div>
      )}
      <Dialog open={!!secret} onClose={() => setSecret(null)} title={`${secret?.type ?? ""} webhook credentials`} footer={<Button onClick={() => setSecret(null)}>I have copied it</Button>}>
        <p className="mb-3 text-sm text-ink-soft">Shown once. Sign webhook bodies with HMAC-SHA256 over <code className="font-mono text-xs">timestamp.rawBody</code>.</p><dl><KV k="Key ID (x-settla-key-id)" v={secret?.keyId} mono /><KV k="Signing secret" v={secret?.webhookSecret} mono /></dl>
      </Dialog>
      <p className="mt-4 text-xs text-ink-muted">Live mode requires real vendor credentials; until then adapters run in <b>mock</b> mode and simulate success, timeout, failure, duplicate and verification mismatch.</p>
    </div>
  );
}
