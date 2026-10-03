"use client";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, tenantApi, usersApi } from "@/services";
import { useAppDispatch, useAppSelector, authActions } from "@/store";
import { Badge, Button, ErrorState, KV, PageHeader, Panel, PanelHeader, Select, SkeletonRows } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { DataTable, type Col } from "@/components/ui/DataTable";
import { ago, ms, titleCase } from "@/lib/utils";
import type { ExecutionMode, Role, User } from "@/types/api";

const SECTIONS = [
  ["/settings/team", "Team", "People, roles and access status"], ["/settings/roles", "Roles & permissions", "What each role can do"],
  ["/settings/security", "Security", "Sessions, tokens and safeguards"], ["/settings/integrations", "Integrations", "Connect payment, order, ticket and CRM systems"],
  ["/settings/automation", "Automation", "Execution mode and limits for Rhea"], ["/settings/billing", "Billing", "Plan and usage"],
] as const;

export function SettingsHome() {
  return (
    <div><PageHeader title="Settings" subtitle="Tenant configuration, access and safety controls." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{SECTIONS.map(([href, t, d]) => <Link key={href} href={href}><Panel className="h-full transition-shadow hover:shadow-lg"><h2 className="font-display text-xl">{t}</h2><p className="mt-1 text-sm text-ink-muted">{d}</p></Panel></Link>)}</div></div>
  );
}

const ROLES: Role[] = ["TENANT_ADMIN", "CX_LEAD", "CX_AGENT", "FINANCE", "AUDITOR", "VIEWER"];
export function Team() {
  const q = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const me = useAppSelector((s) => s.auth.user);
  const canWrite = me?.permissions.includes("users:write");
  const toast = useToast(); const qc = useQueryClient();
  const patch = useMutation({ mutationFn: (v: { id: string; role?: Role; status?: "active" | "disabled" }) => usersApi.patch(v.id, v), onSuccess: () => { toast.push({ kind: "success", title: "Access updated", body: "Takes effect on the user's next request." }); void qc.invalidateQueries({ queryKey: ["users"] }); }, onError: (e: Error) => toast.push({ kind: "error", title: "Not updated", body: e.message }) });
  const cols: Col<User>[] = [
    { key: "n", header: "Name", cell: (u) => <span className="font-medium">{u.name}{u.id === me?.id && <Badge tone="brand" className="ml-2">You</Badge>}</span> }, { key: "e", header: "Email", cell: (u) => u.email },
    { key: "r", header: "Role", cell: (u) => <Select aria-label={`Role for ${u.name}`} className="w-40" disabled={!canWrite || u.id === me?.id || u.role === "SUPER_ADMIN"} value={u.role} onChange={(e) => patch.mutate({ id: u.id, role: e.target.value as Role })}>{[...ROLES, ...(u.role === "SUPER_ADMIN" ? (["SUPER_ADMIN"] as Role[]) : [])].map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}</Select> },
    { key: "s", header: "Status", cell: (u) => <Badge tone={u.status === "active" ? "ok" : "bad"}>{u.status}</Badge> },
    { key: "a", header: "", cell: (u) => canWrite && u.id !== me?.id && u.role !== "SUPER_ADMIN" ? <Button size="sm" variant="outline" onClick={() => patch.mutate({ id: u.id, status: u.status === "active" ? "disabled" : "active" })}>{u.status === "active" ? "Disable" : "Enable"}</Button> : null },
  ];
  return <div><PageHeader title="Team" subtitle="Role and status changes revoke sessions and apply immediately." /><Panel><DataTable cols={cols} rows={q.data?.map((u) => ({ ...u, _id: u.id }))} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} empty={{ title: "No users", body: "Invite teammates to share the queue." }} /></Panel></div>;
}

export function Roles() {
  const q = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const byRole = new Map<string, Set<string>>();
  q.data?.forEach((u) => { const s = byRole.get(u.role) ?? new Set<string>(); u.permissions.forEach((p) => s.add(p)); byRole.set(u.role, s); });
  return (
    <div><PageHeader title="Roles & permissions" subtitle="Granular permissions per role. Permissions are re-read from the database on every request." />
      {q.isLoading ? <SkeletonRows rows={3} /> : q.error ? <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel> : (
        <div className="grid gap-5 md:grid-cols-2">{[...byRole.entries()].map(([role, perms]) => <Panel key={role}><PanelHeader title={titleCase(role)} hint={`${perms.size} permissions`} /><div className="flex flex-wrap gap-1.5">{[...perms].sort().map((p) => <Badge key={p} className="font-mono">{p}</Badge>)}</div></Panel>)}</div>
      )}
      <p className="mt-3 text-xs text-ink-muted">Only roles present in your team are listed.</p></div>
  );
}

export function Security() {
  const user = useAppSelector((s) => s.auth.user);
  const rows: [string, string][] = [
    ["Access tokens", "15 minute JWT kept in memory only (never localStorage)"], ["Refresh tokens", "httpOnly, SameSite=Strict cookie. Rotated on every use; reuse revokes the whole session family"],
    ["Tenant isolation", "Tenant is derived from your verified identity; request bodies cannot select a tenant"], ["Financial actions", "Idempotency keys, gateway-authoritative amounts, policy + permission gates, read-after-write verification"],
    ["Webhooks", "HMAC-SHA256 signature, 5 minute timestamp window, replay protection"], ["AI safety", "Customer text is untrusted data; model output is schema-validated and cannot widen its own authority"],
  ];
  return <div><PageHeader title="Security" subtitle="How this workspace is protected." /><div className="grid gap-5 lg:grid-cols-3"><Panel className="lg:col-span-2"><dl>{rows.map(([k, v]) => <div key={k} className="grid gap-1 border-b hairline py-3 sm:grid-cols-[180px_1fr] last:border-0"><dt className="text-sm font-medium">{k}</dt><dd className="text-sm text-ink-soft">{v}</dd></div>)}</dl></Panel><Panel><PanelHeader title="Your session" /><dl><KV k="User" v={user?.email} /><KV k="Role" v={user && titleCase(user.role)} /><KV k="Permissions" v={user?.permissions.length} /></dl></Panel></div></div>;
}

const MODES: ExecutionMode[] = ["AUTONOMOUS", "RECOMMEND_ONLY", "DISABLED"];
export function Automation() {
  const q = useQuery({ queryKey: ["tenant"], queryFn: tenantApi.get });
  const canWrite = useAppSelector((s) => s.auth.user?.permissions.includes("tenant:write"));
  const dispatch = useAppDispatch(); const toast = useToast(); const qc = useQueryClient();
  const m = useMutation({ mutationFn: (mode: ExecutionMode) => tenantApi.setMode(mode, "Changed from settings"), onSuccess: (r) => { dispatch(authActions.modeChanged(r.executionMode)); toast.push({ kind: "success", title: `Execution mode: ${r.executionMode}` }); void qc.invalidateQueries({ queryKey: ["tenant"] }); }, onError: (e: Error) => toast.push({ kind: "error", title: "Not changed", body: e.message }) });
  if (q.isLoading) return <SkeletonRows rows={3} />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  return (
    <div><PageHeader title="Automation" subtitle="Control how much Rhea may do on her own." />
      <div className="grid gap-5 md:grid-cols-2">
        <Panel strong><PanelHeader title="Execution mode" hint="Kill switch. Takes effect immediately." />
          <div className="space-y-2">{MODES.map((m2) => <button key={m2} disabled={!canWrite || m.isPending} onClick={() => m.mutate(m2)} aria-pressed={q.data.executionMode === m2} className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${q.data.executionMode === m2 ? "border-burgundy-500 bg-burgundy-50" : "hairline bg-white/[0.05] hover:bg-white/10"} disabled:opacity-60`}><div className="font-medium">{titleCase(m2)}</div><div className="text-xs text-ink-muted">{m2 === "AUTONOMOUS" ? "Investigates and executes within policy and limits" : m2 === "RECOMMEND_ONLY" ? "Investigates and recommends. Does not execute sensitive actions" : "Does nothing; every case goes to a human"}</div></button>)}</div>
          {!canWrite && <p className="mt-3 text-xs text-ink-muted">Changing the mode requires tenant:write.</p>}</Panel>
        <Panel><PanelHeader title="Limits" /><dl><KV k="Auto-execution limit" v={`₹${q.data.limits?.autoExecuteInr?.toLocaleString("en-IN")}`} /><KV k="Confidence threshold" v="75% (below → human)" /><KV k="Integration mode" v={q.data.integrationMode} /></dl><p className="mt-3 text-xs text-ink-muted">Limits are enforced by the backend policy engine.</p></Panel>
      </div></div>
  );
}

export function Billing() {
  return <div><PageHeader title="Billing" subtitle="Plan and usage." /><Panel><div className="py-8 text-center"><h2 className="font-display text-xl">Billing is not enabled in this release</h2><p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">No payment provider is connected for Settla subscriptions yet. Usage metrics are available under Analytics.</p></div></Panel></div>;
}

/* ---------- Admin ---------- */
export function AdminHome() {
  return <div><PageHeader title="Admin" subtitle="Platform operations. Super admin only." /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[["/admin/tenants", "Tenants"], ["/admin/users", "Users"], ["/admin/system", "System"], ["/admin/audit", "Audit"]].map(([h, t]) => <Link key={h} href={h}><Panel className="transition-shadow hover:shadow-lg"><h2 className="font-display text-xl">{t}</h2></Panel></Link>)}</div></div>;
}
export function AdminTenants() {
  const q = useQuery({ queryKey: ["admin-tenants"], queryFn: adminApi.tenants });
  const cols: Col<{ _id: string; name: string; slug: string; status: string; executionMode: string }>[] = [
    { key: "n", header: "Tenant", cell: (t) => <span className="font-medium">{t.name}</span> }, { key: "s", header: "Slug", cell: (t) => <span className="font-mono text-xs">{t.slug}</span> },
    { key: "st", header: "Status", cell: (t) => <Badge tone={t.status === "active" ? "ok" : "bad"}>{t.status}</Badge> }, { key: "m", header: "Mode", cell: (t) => titleCase(t.executionMode) },
  ];
  return <div><PageHeader title="Tenants" /><Panel><DataTable cols={cols} rows={q.data?.map((t) => ({ ...t, _id: t.id }))} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} empty={{ title: "No tenants", body: "Tenants are created during onboarding." }} /></Panel></div>;
}
export function AdminSystem() {
  const q = useQuery({ queryKey: ["system"], queryFn: adminApi.system, refetchInterval: 15000 });
  if (q.isLoading) return <SkeletonRows rows={3} />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const s = q.data;
  return <div><PageHeader title="System status" /><Panel className="max-w-xl"><dl><KV k="Database" v={<Badge tone={s.db === "connected" ? "ok" : "bad"}>{s.db}</Badge>} /><KV k="Queue (Redis)" v={s.redis ? "Redis / BullMQ" : "In-process fallback (dev only)"} /><KV k="Integration mode" v={s.mode} /><KV k="LLM provider" v={s.llm} /><KV k="Uptime" v={ms(s.uptime * 1000)} /><KV k="Memory" v={`${s.memoryMb} MB`} /><KV k="Runtime" v={s.node} /></dl><p className="mt-3 text-xs text-ink-muted">Refreshed {ago(new Date())}</p></Panel></div>;
}
