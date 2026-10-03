import { api } from "./apiClient";
import type {
  Approval, AuditLog, CaseDetail, CaseRow, Customer, Escalation, ExecutionMode, IntegrationRow, KnowledgeHit, Notification, OrderRow, Page, PaymentRow,
  PolicyDef, Summary, TenantInfo, TimePoint, Trace, User, DecisionDoc, Role,
} from "@/types/api";

type Q = Record<string, string | number | boolean | undefined | null>;

export const authApi = {
  login: (email: string, password: string) => api<{ accessToken: string; user: User; tenant: TenantInfo }>("/auth/login", { method: "POST", body: { email, password } }),
  me: () => api<{ user: User; tenant: TenantInfo }>("/auth/me"),
  logout: () => api<{ loggedOut: boolean }>("/auth/logout", { method: "POST" }),
};

export const casesApi = {
  list: (query: Q) => api<Page<CaseRow>>("/cases", { query }),
  get: (id: string) => api<CaseDetail>(`/cases/${id}`),
  create: (b: { paymentId: string; customerEmail?: string; customerMessage?: string; channel?: string }) => api<CaseRow>("/cases", { method: "POST", body: b }),
};
export const paymentsApi = {
  list: (query: Q) => api<Page<PaymentRow>>("/payments", { query }),
  get: (id: string) => api<{ payment: PaymentRow & { gatewayPaymentId?: string; id?: string }; cases: CaseRow[]; orders: OrderRow[] }>(`/payments/${id}`),
  refund: (id: string, body: { amount?: number; reason?: string }, key: string) =>
    api<{ status: string; approvalId?: string; amount: number; caseId: string }>(`/payments/${id}/refund`, { method: "POST", body, idempotencyKey: key }),
};
export const ordersApi = { list: (query: Q) => api<Page<OrderRow>>("/orders", { query }), get: (id: string) => api<OrderRow & Record<string, unknown>>(`/orders/${id}`) };
export const customersApi = {
  list: (query: Q) => api<Page<Customer>>("/customers", { query }),
  get: (id: string) => api<{ customer: Customer; payments: PaymentRow[]; cases: CaseRow[]; orders: OrderRow[] }>(`/customers/${id}`),
};
export const approvalsApi = {
  list: (query: Q) => api<Page<Approval>>("/approvals", { query }),
  decide: (id: string, body: { decision: "approve" | "reject"; note?: string; editedAmount?: number }) => api<{ outcome: string }>(`/approvals/${id}/decision`, { method: "POST", body }),
};
export const escalationsApi = {
  list: (query: Q) => api<Page<Escalation>>("/escalations", { query }),
  get: (id: string) => api<Escalation>(`/escalations/${id}`),
  act: (id: string, body: { action: "take_over" | "retry" | "refund" | "close"; note?: string; amount?: number }) => api<Record<string, unknown>>(`/escalations/${id}/actions`, { method: "POST", body }),
};
export const decisionsApi = { list: (query: Q) => api<Page<Trace>>("/decisions", { query }), get: (id: string) => api<{ trace: Trace; decision: DecisionDoc }>(`/decisions/${id}`) };
export const policiesApi = { list: () => api<PolicyDef[]>("/policies"), get: (id: string) => api<PolicyDef & { evaluations: unknown[] }>(`/policies/${id}`) };
export const integrationsApi = {
  list: () => api<IntegrationRow[]>("/integrations"),
  put: (type: string, body: { mode?: "mock" | "live"; enabled?: boolean; credentials?: Record<string, string> }) => api<{ type: string; keyId?: string; webhookSecret?: string }>(`/integrations/${type}`, { method: "PUT", body }),
  test: (type: string) => api<{ ok: boolean; message?: string }>(`/integrations/${type}/test`, { method: "POST" }),
};
export const analyticsApi = { summary: (days = 30) => api<Summary>("/analytics/summary", { query: { days } }), series: (days = 14) => api<TimePoint[]>("/analytics/timeseries", { query: { days } }) };
export const auditApi = { list: (query: Q) => api<Page<AuditLog>>("/audit", { query }) };
export const notificationsApi = { list: () => api<Page<Notification>>("/notifications", { query: { pageSize: 20 } }), read: (id: string) => api(`/notifications/${id}/read`, { method: "POST" }) };
export const tenantApi = {
  get: () => api<TenantInfo & { slug: string; status: string; integrationMode: string }>("/tenant"),
  setMode: (mode: ExecutionMode, reason?: string) => api<{ executionMode: ExecutionMode }>("/tenant/execution-mode", { method: "PATCH", body: { mode, reason } }),
};
export const usersApi = {
  list: () => api<User[]>("/users"),
  patch: (id: string, body: { role?: Role; status?: "active" | "disabled" }) => api<User>(`/users/${id}`, { method: "PATCH", body }),
};
export const knowledgeApi = {
  list: () => api<{ _id: string; title: string; kind: string; createdAt: string }[]>("/knowledge"),
  search: (q: string) => api<KnowledgeHit[]>("/knowledge/search", { query: { q } }),
};
export const demoApi = { run: (scenario?: string) => api<{ result: { status: string }; case: CaseDetail }>("/demo/run", { method: "POST", query: { scenario } }) };
export const adminApi = {
  tenants: () => api<{ id: string; name: string; slug: string; status: string; executionMode: string }[]>("/admin/tenants"),
  system: () => api<{ uptime: number; node: string; mode: string; llm: string; redis: boolean; db: string; memoryMb: number }>("/admin/system"),
};
