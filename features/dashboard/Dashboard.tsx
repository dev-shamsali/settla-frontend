"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PlayCircle } from "lucide-react";
import { analyticsApi, approvalsApi, casesApi, demoApi, adminApi } from "@/services";
import { useAppSelector } from "@/store";
import { Badge, Button, EmptyState, ErrorState, PageHeader, Panel, PanelHeader, RiskBadge, Skeleton, Stat, StatusBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { ago, inr, ms, titleCase } from "@/lib/utils";

const C = { brand: "#d0606f", brandSoft: "#7a3a45", ok: "#6fcf97", warn: "#e2ad4f", ink: "#4a4039", grid: "rgba(255,255,255,.08)" };
const axis = { stroke: "#8f8f8f", fontSize: 11, tickLine: false, axisLine: false } as const;
const tip = { contentStyle: { background: "rgba(20,20,20,.96)", color: "#f5f5f5", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, fontSize: 12 } };
const d = (s: string) => s.slice(5);

export function Dashboard() {
  const perms = useAppSelector((s) => s.auth.user?.permissions) ?? [];
  const live = useAppSelector((s) => s.ui.live);
  const stream = useAppSelector((s) => s.ui.stream);
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const sum = useQuery({ queryKey: ["summary"], queryFn: () => analyticsApi.summary(30), enabled: perms.includes("analytics:read") });
  const series = useQuery({ queryKey: ["series"], queryFn: () => analyticsApi.series(14), enabled: perms.includes("analytics:read") });
  const recent = useQuery({ queryKey: ["cases", "recent"], queryFn: () => casesApi.list({ pageSize: 6 }), enabled: perms.includes("cases:read") });
  const pending = useQuery({ queryKey: ["approvals", "pending"], queryFn: () => approvalsApi.list({ status: "PENDING", pageSize: 5 }), enabled: perms.includes("approvals:read") });
  const health = useQuery({ queryKey: ["system"], queryFn: adminApi.system, enabled: perms.includes("admin:system") });
  const run = useMutation({
    mutationFn: () => demoApi.run(),
    onSuccess: (r) => { toast.push({ kind: r.result.status === "RESOLVED" ? "success" : "info", title: `Demo case ${r.case.case.caseNumber}: ${titleCase(r.result.status)}`, body: "Simulated data on mock integrations." }); void qc.invalidateQueries(); router.push(`/cases/${r.case.case._id}`); },
    onError: (e: Error) => toast.push({ kind: "error", title: "Demo failed", body: e.message }),
  });

  const s = sum.data;
  const empty = s && s.casesTotal === 0;
  const hasSeries = (series.data ?? []).length > 0;
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="What is happening, what needs attention, and what Rhea has already done. Last 30 days."
        actions={perms.includes("cases:create") && <Button variant="outline" loading={run.isPending} onClick={() => run.mutate()}><PlayCircle className="h-4 w-4" />Run demo case</Button>} />
      {sum.error ? <Panel><ErrorState error={sum.error} onRetry={() => sum.refetch()} /></Panel> : (
        <>
          <Panel strong className="mb-5">
            {!s ? <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4 xl:grid-cols-6">
                <Stat label="Cases today" value={s.casesToday} />
                <Stat label="Resolved" value={s.casesResolved} />
                <Stat label="Autonomous rate" value={`${s.autonomousResolutionRate}%`} tone="ok" />
                <Stat label="Escalations" value={s.escalations} tone={s.escalations ? "warn" : undefined} />
                <Stat label="Avg resolution" value={ms(s.avgResolutionMs)} />
                <Stat label="First response" value={ms(s.firstResponseMs)} />
                <Stat label="Recovered" value={inr(s.recoveredRevenue)} tone="ok" />
                <Stat label="Refunded" value={inr(s.refundedRevenue)} />
                <Stat label="CSAT" value={s.csat ?? "—"} sub={s.csat === null ? "No CSAT source connected" : undefined} />
                <Stat label="Agent hours saved" value={s.agentHoursSaved} sub="est. 12 min / autonomous case" />
                <Stat label="Failed actions" value={s.failedActions} tone={s.failedActions ? "bad" : undefined} />
                <Stat label="Pending approvals" value={s.pendingApprovals} tone={s.pendingApprovals ? "warn" : undefined} />
              </div>
            )}
          </Panel>

          {empty ? (
            <Panel><EmptyState title="No unresolved payment cases." body="When a payment is captured without a matching order, Rhea will automatically investigate it. Run the demo case to see a full resolution on simulated data."
              action={perms.includes("cases:create") && <Button loading={run.isPending} onClick={() => run.mutate()}>Run demo case</Button>} /></Panel>
          ) : (
            <div className="grid gap-5 lg:grid-cols-6">
              <Panel className="lg:col-span-4"><PanelHeader title="Revenue recovered vs refunded" hint="INR per day" />
                <div className="h-60">{!hasSeries ? <Skeleton className="h-full" /> : <ResponsiveContainer><BarChart data={series.data}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="date" tickFormatter={d} {...axis} /><YAxis {...axis} width={48} /><Tooltip {...tip} formatter={(v) => inr(Number(v))} /><Bar dataKey="recovered" name="Recovered" fill={C.ok} radius={[4, 4, 0, 0]} /><Bar dataKey="refunded" name="Refunded" fill={C.brand} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</div></Panel>
              <Panel className="lg:col-span-2"><PanelHeader title="Autonomous vs human" />
                <div className="h-60">{s && <ResponsiveContainer><PieChart><Pie data={[{ n: "Autonomous", v: s.autonomousVsHuman.autonomous }, { n: "Human", v: s.autonomousVsHuman.human }]} dataKey="v" nameKey="n" innerRadius={55} outerRadius={80} paddingAngle={3}><Cell fill={C.brand} /><Cell fill={C.brandSoft} /></Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer>}</div>
                <div className="flex justify-center gap-4 text-xs text-ink-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: C.brand }} />Autonomous {s?.autonomousVsHuman.autonomous}</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: C.brandSoft }} />Human {s?.autonomousVsHuman.human}</span></div></Panel>
              <Panel className="lg:col-span-3"><PanelHeader title="Resolution time trend" hint="Average seconds" />
                <div className="h-52">{hasSeries && <ResponsiveContainer><LineChart data={(series.data ?? []).map((p) => ({ ...p, sec: Math.round(p.avgResolutionMs / 1000) }))}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="date" tickFormatter={d} {...axis} /><YAxis {...axis} width={36} /><Tooltip {...tip} /><Line dataKey="sec" name="Seconds" stroke={C.brand} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>}</div></Panel>
              <Panel className="lg:col-span-3"><PanelHeader title="Case volume" />
                <div className="h-52">{hasSeries && <ResponsiveContainer><BarChart data={series.data}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="date" tickFormatter={d} {...axis} /><YAxis {...axis} width={30} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="cases" name="Cases" fill={C.brand} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</div></Panel>
              <Panel className="lg:col-span-3"><PanelHeader title="Escalation reasons" />
                {s?.escalationReasons.length ? <div style={{ height: Math.max(120, s.escalationReasons.length * 36) }}><ResponsiveContainer><BarChart layout="vertical" data={s.escalationReasons.map((r) => ({ ...r, reason: titleCase(r.reason) }))}><XAxis type="number" hide /><YAxis type="category" dataKey="reason" width={140} {...axis} /><Tooltip {...tip} /><Bar dataKey="count" fill={C.warn} radius={4} /></BarChart></ResponsiveContainer></div> : <p className="py-8 text-center text-sm text-ink-muted">No escalations in this window.</p>}</Panel>
              <Panel className="lg:col-span-3"><PanelHeader title="Cases by status" hint="Payment failure categories surface here as they occur" />
                {s?.statusBreakdown.length ? <ul className="space-y-2">{s.statusBreakdown.map((b) => <li key={b.status} className="flex items-center gap-3 text-sm"><StatusBadge status={b.status} /><div className="h-1.5 flex-1 rounded bg-white/[0.07]"><div className="h-full rounded bg-burgundy-500" style={{ width: `${(b.count / s.casesTotal) * 100}%` }} /></div><span className="tabular w-6 text-right">{b.count}</span></li>)}</ul> : null}</Panel>
            </div>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <Panel className="lg:col-span-2"><PanelHeader title="Recent cases" action={<Link href="/cases" className="text-xs font-medium text-burgundy-600 hover:underline">View all</Link>} />
              {recent.data?.items.length ? <ul className="divide-y hairline">{recent.data.items.map((c) => (
                <li key={c._id}><Link href={`/cases/${c._id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-white/[0.05]"><span className="flex items-center gap-3"><span className="font-mono text-xs">{c.caseNumber}</span><span>{c.customerName ?? c.paymentId}</span></span><span className="flex items-center gap-3"><span className="tabular">{inr(c.amount)}</span><RiskBadge level={c.risk?.level} /><StatusBadge status={c.status} /></span></Link></li>))}</ul> : <p className="py-6 text-center text-sm text-ink-muted">No cases yet.</p>}</Panel>
            <div className="space-y-5">
              <Panel><PanelHeader title="Pending approvals" action={<Link href="/approvals" className="text-xs font-medium text-burgundy-600 hover:underline">Queue</Link>} />
                {pending.data?.items.length ? <ul className="space-y-2">{pending.data.items.map((a) => <li key={a._id}><Link href="/approvals" className="flex justify-between text-sm"><span>{a.caseNumber} · {titleCase(a.decision)}</span><span className="tabular font-medium">{inr(a.amount)}</span></Link></li>)}</ul> : <p className="text-sm text-ink-muted">Nothing waiting on a human.</p>}</Panel>
              <Panel><PanelHeader title="Rhea activity" action={<Badge tone={stream === "live" ? "ok" : stream === "offline" ? "bad" : "warn"} dot>{stream}</Badge>} />
                {live.length ? <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">{live.slice(0, 8).map((e) => <li key={e.id} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy-500" /><span className="min-w-0"><span className="break-words">{e.text}</span> <span className="text-[11px] text-ink-muted">{ago(e.ts)}</span></span></li>)}</ul> : <p className="text-sm text-ink-muted">Live events appear here as Rhea works.</p>}</Panel>
              {health.data && <Panel><PanelHeader title="System health" /><dl className="space-y-1 text-sm"><div className="flex justify-between"><dt className="text-ink-muted">Database</dt><dd><Badge tone={health.data.db === "connected" ? "ok" : "bad"}>{health.data.db}</Badge></dd></div><div className="flex justify-between"><dt className="text-ink-muted">Integrations</dt><dd>{health.data.mode}</dd></div><div className="flex justify-between"><dt className="text-ink-muted">LLM</dt><dd>{health.data.llm}</dd></div><div className="flex justify-between"><dt className="text-ink-muted">Uptime</dt><dd>{ms(health.data.uptime * 1000)}</dd></div></dl></Panel>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
