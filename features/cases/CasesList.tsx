"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Search } from "lucide-react";
import { casesApi } from "@/services";
import { DataTable, type Col } from "@/components/ui/DataTable";
import { DemoBadge, Input, PageHeader, Panel, RiskBadge, Select, StatusBadge, Badge } from "@/components/ui/primitives";
import { dateTime, inr, ms, pct, titleCase } from "@/lib/utils";
import type { CaseRow } from "@/types/api";
import { CASE_STATES } from "./states";
import { NewCaseDialog } from "./NewCaseDialog";
import { useAppSelector } from "@/store";

export function CasesList({ initialNew }: { initialNew?: boolean }) {
  const router = useRouter();
  const canCreate = useAppSelector((s) => s.auth.user?.permissions.includes("cases:create"));
  const [search, setSearch] = useState("");
  const [dq, setDq] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [mode, setMode] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({ key: "createdAt", order: "desc" });
  useEffect(() => { const t = setTimeout(() => { setDq(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const q = useQuery({
    queryKey: ["cases", { dq, status, risk, mode, page, sort }],
    queryFn: () => casesApi.list({ search: dq, status, risk, autonomous: mode, page, pageSize: 20, sort: sort.key, order: sort.order }),
  });
  const cols: Col<CaseRow>[] = [
    { key: "case", header: "Case", sortKey: "createdAt", cell: (r) => <span className="flex items-center gap-2"><span className="font-mono text-xs font-medium">{r.caseNumber}</span>{r.demo && <DemoBadge />}</span> },
    { key: "customer", header: "Customer", cell: (r) => r.customerName ?? <span className="text-ink-muted">—</span> },
    { key: "amount", header: "Amount", sortKey: "amount", cell: (r) => <span className="tabular font-medium">{inr(r.amount)}</span> },
    { key: "payment", header: "Payment", hideBelow: "lg", cell: (r) => <span className="font-mono text-xs text-ink-muted">{r.paymentId}</span> },
    { key: "status", header: "Status", sortKey: "status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "risk", header: "Risk", hideBelow: "md", cell: (r) => <RiskBadge level={r.risk?.level} score={r.risk?.score} /> },
    { key: "conf", header: "Confidence", sortKey: "confidence", hideBelow: "lg", cell: (r) => <span className="tabular">{pct(r.confidence)}</span> },
    { key: "decision", header: "Decision", hideBelow: "md", cell: (r) => (r.decision ? <span className="text-xs">{titleCase(r.decision)}</span> : "—") },
    { key: "by", header: "Handled by", hideBelow: "lg", cell: (r) => (r.autonomous === null ? "—" : <Badge tone={r.autonomous ? "ok" : "warn"}>{r.autonomous ? "Autonomous" : "Human"}</Badge>) },
    { key: "res", header: "Resolution", sortKey: "resolutionMs", hideBelow: "lg", cell: (r) => <span className="tabular">{ms(r.resolutionMs)}</span> },
    { key: "created", header: "Created", sortKey: "createdAt", cell: (r) => <span className="text-xs text-ink-muted">{dateTime(r.createdAt)}</span> },
  ];
  return (
    <div>
      <PageHeader title="Cases" subtitle="Every money-debited, no-order case: what Rhea decided, what she did, and what needs a human." actions={canCreate && <NewCaseDialog defaultOpen={initialNew} />} />
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1 basis-56"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" aria-hidden /><Input aria-label="Search cases" className="pl-9" placeholder="Search case, customer, payment" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select aria-label="Status" className="w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{CASE_STATES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</Select>
          <Select aria-label="Risk" className="w-32" value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1); }}><option value="">Any risk</option>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((r) => <option key={r}>{r}</option>)}</Select>
          <Select aria-label="Handled by" className="w-40" value={mode} onChange={(e) => { setMode(e.target.value); setPage(1); }}><option value="">Auto + human</option><option value="true">Autonomous</option><option value="false">Human</option></Select>
        </div>
        <DataTable cols={cols} rows={q.data?.items} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} onRowClick={(r) => router.push(`/cases/${r._id}`)}
          sort={sort} onSort={(k) => setSort((s) => ({ key: k, order: s.key === k && s.order === "desc" ? "asc" : "desc" }))} page={q.data?.page} totalPages={q.data?.totalPages} total={q.data?.total} onPage={setPage}
          empty={{ icon: <FolderKanban className="h-5 w-5" />, title: dq || status || risk || mode ? "No cases match these filters" : "No unresolved payment cases.", body: dq || status || risk || mode ? "Try clearing a filter." : "When a payment is captured without a matching order, Rhea will automatically investigate it." }} />
      </Panel>
    </div>
  );
}
