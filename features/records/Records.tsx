"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Search, ShoppingBag, Users } from "lucide-react";
import { customersApi, ordersApi, paymentsApi } from "@/services";
import { useAppSelector } from "@/store";
import { DataTable, type Col } from "@/components/ui/DataTable";
import { Badge, Button, ErrorState, Field, Input, KV, PageHeader, Panel, PanelHeader, RiskBadge, Skeleton, StatusBadge, DemoBadge, Textarea } from "@/components/ui/primitives";
import { FinancialConfirm } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { dateTime, inr, titleCase } from "@/lib/utils";
import type { Customer, OrderRow, PaymentRow } from "@/types/api";

function useSearchPage<T>(key: string, fn: (q: Record<string, string | number>) => Promise<{ items: T[]; page: number; totalPages: number; total: number }>) {
  const [search, setSearch] = useState(""); const [dq, setDq] = useState(""); const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setDq(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);
  const q = useQuery({ queryKey: [key, dq, page], queryFn: () => fn({ search: dq, page, pageSize: 20 }) });
  return { q, search, setSearch, page, setPage, dq };
}
const SearchBox = ({ v, set }: { v: string; set: (s: string) => void }) => (
  <div className="relative mb-4 max-w-sm"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" aria-hidden /><Input aria-label="Search" className="pl-9" placeholder="Search" value={v} onChange={(e) => set(e.target.value)} /></div>
);

/* ---------- Payments ---------- */
export function PaymentsList() {
  const router = useRouter();
  const s = useSearchPage<PaymentRow>("payments", paymentsApi.list);
  const cols: Col<PaymentRow>[] = [
    { key: "id", header: "Payment", cell: (r) => <span className="flex items-center gap-2"><span className="font-mono text-xs font-medium">{r.gatewayPaymentId}</span>{r.demo && <DemoBadge />}</span> },
    { key: "a", header: "Amount", cell: (r) => <span className="tabular font-medium">{inr(r.amount)}</span> },
    { key: "s", header: "Status", cell: (r) => <Badge tone={r.status === "captured" ? "ok" : r.status === "failed" ? "bad" : "warn"}>{titleCase(r.status)}</Badge> },
    { key: "r", header: "Refunded", hideBelow: "md", cell: (r) => inr(r.amountRefunded) },
    { key: "e", header: "Customer", hideBelow: "lg", cell: (r) => r.email ?? "—" },
    { key: "t", header: "Created", cell: (r) => <span className="text-xs text-ink-muted">{dateTime(r.createdAt)}</span> },
  ];
  return (
    <div><PageHeader title="Payments" subtitle="Payments Rhea has investigated. Amounts shown here are re-read from the gateway on every detail view." />
      <Panel><SearchBox v={s.search} set={s.setSearch} /><DataTable cols={cols} rows={s.q.data?.items} loading={s.q.isLoading} error={s.q.error} onRetry={() => s.q.refetch()} onRowClick={(r) => router.push(`/payments/${r.gatewayPaymentId}`)} page={s.q.data?.page} totalPages={s.q.data?.totalPages} total={s.q.data?.total} onPage={s.setPage}
        empty={{ icon: <CreditCard className="h-5 w-5" />, title: "No payments yet", body: "When a payment is captured without a matching order, Rhea will automatically investigate it and the payment appears here." }} /></Panel></div>
  );
}

export function PaymentDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["payment", id], queryFn: () => paymentsApi.get(id) });
  const canRefund = useAppSelector((s) => s.auth.user?.permissions.includes("payments:refund"));
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [amount, setAmount] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  const toast = useToast(); const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => paymentsApi.refund(id, { ...(amount && { amount: Number(amount) }), ...(reason && { reason }) }, key),
    onSuccess: (r) => { toast.push({ kind: r.status === "REFUNDED" ? "success" : "info", title: r.status === "APPROVAL_REQUIRED" ? "Approval required before refund" : `Refund: ${titleCase(r.status)}`, body: r.status === "APPROVAL_REQUIRED" ? "Sent to the approval queue. No money has moved." : undefined }); setOpen(false); void qc.invalidateQueries(); },
    onError: (e: Error) => { toast.push({ kind: "error", title: "Refund not completed", body: e.message }); setOpen(false); },
  });
  if (q.isLoading) return <Skeleton className="h-72" />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const p = q.data.payment as PaymentRow & { id?: string; contact?: string };
  const balance = p.amount - (p.amountRefunded ?? 0);
  return (
    <div>
      <PageHeader title={p.id ?? id} subtitle="Authoritative values from the payment gateway" actions={<Button disabled={!canRefund || balance <= 0} onClick={() => setOpen(true)}>Refund</Button>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2"><PanelHeader title="Payment" /><dl className="grid gap-x-8 sm:grid-cols-2"><div><KV k="Status" v={<Badge tone={p.status === "captured" ? "ok" : "warn"}>{titleCase(p.status)}</Badge>} /><KV k="Amount" v={inr(p.amount)} /><KV k="Refunded" v={inr(p.amountRefunded)} /></div><div><KV k="Refundable balance" v={inr(balance)} /><KV k="Customer" v={p.email ?? "—"} /><KV k="Contact" v={p.contact ?? "—"} /></div></dl></Panel>
        <Panel><PanelHeader title="Orders" />{q.data.orders.length ? q.data.orders.map((o) => <Link key={o._id} href={`/orders/${o._id}`} className="flex justify-between py-1 text-sm"><span className="font-mono text-xs">{o.orderNumber}</span><span>{inr(o.total)}</span></Link>) : <p className="text-sm text-ink-muted">No order linked.</p>}</Panel>
        <Panel className="lg:col-span-3"><PanelHeader title="Cases" />{q.data.cases.length ? q.data.cases.map((c) => <Link key={c._id} href={`/cases/${c._id}`} className="flex items-center justify-between py-1.5 text-sm"><span className="font-mono text-xs">{c.caseNumber}</span><StatusBadge status={c.status} /></Link>) : <p className="text-sm text-ink-muted">No cases.</p>}</Panel>
      </div>
      <FinancialConfirm open={open} onClose={() => setOpen(false)} confirmLabel="Request refund" danger loading={m.isPending} onConfirm={() => m.mutate()}
        rows={[{ k: "Action", v: "Refund" }, { k: "Payment", v: <span className="font-mono">{p.id ?? id}</span> }, { k: "Customer", v: p.email ?? "—" }, { k: "Amount", v: amount ? inr(Number(amount)) : `${inr(balance)} (full balance)` }, { k: "Approval", v: "Required above the auto limit (backend decides)" }]} />
      <Panel className="mt-5 max-w-xl"><PanelHeader title="Refund options" hint="Optional. Leave blank to refund the full remaining balance." />
        <div className="space-y-3"><Field label="Partial amount (INR)"><Input type="number" min={1} max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field><Field label="Reason"><Textarea value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} /></Field></div></Panel>
    </div>
  );
}

/* ---------- Orders ---------- */
export function OrdersList() {
  const router = useRouter();
  const s = useSearchPage<OrderRow>("orders", ordersApi.list);
  const cols: Col<OrderRow>[] = [
    { key: "n", header: "Order", cell: (r) => <span className="font-mono text-xs font-medium">{r.orderNumber}</span> },
    { key: "p", header: "Payment", cell: (r) => <span className="font-mono text-xs text-ink-muted">{r.paymentRef}</span> },
    { key: "t", header: "Total", cell: (r) => <span className="tabular font-medium">{inr(r.total)}</span> },
    { key: "s", header: "Status", cell: (r) => <Badge tone={r.status === "cancelled" ? "bad" : "ok"}>{titleCase(r.status)}</Badge> },
    { key: "c", header: "Created", cell: (r) => <span className="text-xs text-ink-muted">{dateTime(r.createdAt)}</span> },
  ];
  return <div><PageHeader title="Orders" subtitle="Orders found or created while resolving payment mismatches." /><Panel><SearchBox v={s.search} set={s.setSearch} /><DataTable cols={cols} rows={s.q.data?.items} loading={s.q.isLoading} error={s.q.error} onRetry={() => s.q.refetch()} onRowClick={(r) => router.push(`/orders/${r._id}`)} page={s.q.data?.page} totalPages={s.q.data?.totalPages} total={s.q.data?.total} onPage={s.setPage} empty={{ icon: <ShoppingBag className="h-5 w-5" />, title: "No orders yet", body: "Orders appear when Rhea finds or recovers one for a captured payment." }} /></Panel></div>;
}
export function OrderDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["order", id], queryFn: () => ordersApi.get(id) });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const o = q.data;
  return <div><PageHeader title={`Order ${o.orderNumber}`} /><Panel className="max-w-xl"><dl><KV k="Payment" v={<Link className="font-mono text-xs text-burgundy-700 hover:underline" href={`/payments/${o.paymentRef}`}>{o.paymentRef}</Link>} /><KV k="Total" v={inr(o.total)} /><KV k="Status" v={titleCase(o.status)} /><KV k="Created" v={dateTime(o.createdAt)} /></dl></Panel></div>;
}

/* ---------- Customers ---------- */
export function CustomersList() {
  const router = useRouter();
  const s = useSearchPage<Customer>("customers", customersApi.list);
  const cols: Col<Customer>[] = [
    { key: "n", header: "Name", cell: (r) => <span className="flex items-center gap-2 font-medium">{r.name}{r.demo && <DemoBadge />}</span> },
    { key: "e", header: "Email", cell: (r) => r.email }, { key: "p", header: "Phone", hideBelow: "md", cell: (r) => r.phone ?? "—" },
    { key: "b", header: "Flags", cell: (r) => (r.blocked ? <Badge tone="bad">Blocked</Badge> : <span className="text-ink-muted">—</span>) },
    { key: "c", header: "Since", hideBelow: "lg", cell: (r) => <span className="text-xs text-ink-muted">{dateTime(r.createdAt)}</span> },
  ];
  return <div><PageHeader title="Customers" subtitle="People Rhea has helped. PII is shown only to roles with customers:read." /><Panel><SearchBox v={s.search} set={s.setSearch} /><DataTable cols={cols} rows={s.q.data?.items} loading={s.q.isLoading} error={s.q.error} onRetry={() => s.q.refetch()} onRowClick={(r) => router.push(`/customers/${r._id}`)} page={s.q.data?.page} totalPages={s.q.data?.totalPages} total={s.q.data?.total} onPage={s.setPage} empty={{ icon: <Users className="h-5 w-5" />, title: "No customers yet", body: "Customers are created as Rhea identifies the person behind each payment." }} /></Panel></div>;
}
export function CustomerDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["customer", id], queryFn: () => customersApi.get(id) });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.error || !q.data) return <Panel><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const { customer: c, payments, cases, orders } = q.data;
  return (
    <div><PageHeader title={c.name} subtitle={c.email} />
      <div className="grid gap-5 md:grid-cols-2">
        <Panel><PanelHeader title="Profile" /><dl><KV k="Phone" v={c.phone ?? "—"} /><KV k="Prior refunds" v={c.refundCount ?? 0} /><KV k="Blocked" v={c.blocked ? "Yes" : "No"} /></dl></Panel>
        <Panel><PanelHeader title="Cases" />{cases.length ? cases.map((x) => <Link key={x._id} href={`/cases/${x._id}`} className="flex items-center justify-between py-1.5 text-sm"><span className="font-mono text-xs">{x.caseNumber}</span><span className="flex items-center gap-2">{inr(x.amount)}<RiskBadge level={x.risk?.level} /><StatusBadge status={x.status} /></span></Link>) : <p className="text-sm text-ink-muted">No cases.</p>}</Panel>
        <Panel><PanelHeader title="Payments" />{payments.length ? payments.map((x) => <Link key={x._id} href={`/payments/${x.gatewayPaymentId}`} className="flex justify-between py-1.5 text-sm"><span className="font-mono text-xs">{x.gatewayPaymentId}</span>{inr(x.amount)}</Link>) : <p className="text-sm text-ink-muted">No payments.</p>}</Panel>
        <Panel><PanelHeader title="Orders" />{orders.length ? orders.map((x) => <div key={x._id} className="flex justify-between py-1.5 text-sm"><span className="font-mono text-xs">{x.orderNumber}</span>{inr(x.total)}</div>) : <p className="text-sm text-ink-muted">No orders.</p>}</Panel>
      </div>
    </div>
  );
}
