// Typed contract for the (JavaScript) backend. Keep in sync with settla-backend docs/API.md.
export type CaseStatus =
  | "NEW" | "OBSERVING" | "INVESTIGATING" | "DECIDING" | "AWAITING_APPROVAL" | "EXECUTING" | "VERIFYING"
  | "RESOLVED" | "REFUNDED" | "WAITING_REVERSAL" | "ESCALATED" | "FAILED" | "CLOSED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Decision = "RECOVER_ORDER" | "REFUND" | "WAIT_FOR_AUTO_REVERSAL" | "ESCALATE";
export type ExecutionMode = "AUTONOMOUS" | "RECOMMEND_ONLY" | "DISABLED";
export type Role = "SUPER_ADMIN" | "TENANT_ADMIN" | "CX_LEAD" | "CX_AGENT" | "FINANCE" | "AUDITOR" | "VIEWER";

export interface Page<T> { items: T[]; page: number; pageSize: number; total: number; totalPages: number }

export interface User { id: string; email: string; name: string; role: Role; tenantId: string; permissions: string[]; status?: string; lastLoginAt?: string }
export interface TenantInfo { id: string; name: string; executionMode: ExecutionMode; limits?: { autoExecuteInr: number } }

export interface CaseRow {
  _id: string; caseNumber: string; status: CaseStatus; customerName?: string; customerEmail?: string; paymentId: string; amount: number; currency: string;
  gateway: string; risk: { score: number; level: RiskLevel } | null; confidence: number | null; decision: Decision | null; autonomous: boolean | null;
  resolutionMs?: number; firstResponseMs?: number; createdAt: string; resolvedAt?: string; demo?: boolean; channel?: string; orderNumber?: string;
  escalationReason?: string; followUpsPending?: string[]; customerId?: string; ticketId?: string; traceId?: string; assignedTo?: string; customerMessage?: string;
}

export interface CaseEvent { _id: string; caseId: string; ts: string; type: string; system: string; actor: string; action: string; status: string; metadata: Record<string, unknown>; traceId: string }
export interface Transition { _id: string; fromState: CaseStatus; toState: CaseStatus; actor: string; reason: string; ts: string }
export interface RuleResult { id: string; description: string; severity: string; passed: boolean; detail: string }
export interface PolicyEval { policy: string; policyVersion: string; passed: boolean; requiresApproval?: boolean; reason: string; failedRules: string[]; evaluatedRules: RuleResult[] }
export interface RiskAssessment { riskScore: number; riskLevel: RiskLevel; factors: { name: string; weight: number; detail: string }[] }
export interface Plan {
  decision: Decision; confidence: number; risk: RiskLevel; evidence: string[]; policy: string; required_permission: string; amount: number; tool: string;
  parameters: Record<string, unknown>; idempotency_key: string; verification_plan: string[]; reasoning_summary?: string; escalation_reason?: string;
}
export interface DecisionDoc { _id: string; plan: Plan; proposedPlan: Plan; overrides: string[]; policyEvaluation: PolicyEval | null; riskAssessment: RiskAssessment; source: string; createdAt: string }
export interface Trace {
  _id: string; caseId: string; caseNumber: string; decisionId: string; proposal: Decision; paymentId?: string; amount: number; rules: { id: string; passed: boolean }[];
  policy: string; risk: string; permission: string; idempotency: string; execution: string; verification: string; final: string; overrides?: string[]; createdAt: string;
}
export interface ActionDoc {
  _id: string; tool: string; state: string; amount: number; idempotencyKey: string; attempts: number; error?: { code: string; message: string };
  verification?: { passed: boolean; checks: { name: string; passed: boolean }[] }; policyVersion?: string; riskScore?: number; createdAt: string; result?: Record<string, unknown>;
}
export interface Approval {
  _id: string; caseId: string; caseNumber: string; status: "PENDING" | "APPROVED" | "REJECTED"; action: string; decision: Decision; amount: number; currency: string; paymentId: string;
  customerName?: string; reason: string; risk: { score: number; level: RiskLevel }; policy: { policy: string; version: string; reason: string } | null; evidence: string[];
  requestedBy: string; requestedAt: string; decidedBy?: string; note?: string;
}
export interface Escalation {
  _id: string; caseId: string; caseNumber: string; reason: string; detail?: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; amount: number; risk: { score: number; level: RiskLevel } | null;
  assignedTo?: string; createdAt: string;
  caseFile: {
    customer: { id?: string; name?: string }; payment: { id: string; amount: number; currency: string }; evidence: string[]; reasoningSummary: string | null; risk: CaseRow["risk"];
    policy: { policy: string; version: string; passed: boolean; reason: string } | null; actionsPerformed: { tool: string; state: string }[];
    failedActions: { tool: string; state: string; error?: { message: string } }[]; recommendedAction: string | null; reason?: string;
  };
}
export interface Customer { _id: string; name: string; email: string; phone?: string; blocked?: boolean; refundCount?: number; demo?: boolean; createdAt: string }
export interface PaymentRow { _id: string; gatewayPaymentId: string; status: string; amount: number; amountRefunded: number; email?: string; currency: string; createdAt: string; demo?: boolean }
export interface OrderRow { _id: string; orderNumber: string; paymentRef: string; total: number; status: string; createdAt: string }
export interface CaseDetail {
  case: CaseRow; events: CaseEvent[]; transitions: Transition[]; decisions: DecisionDoc[]; traces: Trace[]; actions: ActionDoc[]; approvals: Approval[]; escalations: Escalation[];
  messages: { _id: string; direction: string; channel: string; template: string; status: string; createdAt: string }[]; audit: AuditLog[];
  customer: Customer | null; payment: PaymentRow | null; orders: OrderRow[]; cart: { items: { sku: string; name?: string; qty: number; price: number }[]; total: number } | null;
}
export interface AuditLog { _id: string; actor: string; actorType: string; action: string; resourceType: string; resourceId?: string; before?: unknown; after?: unknown; ip?: string; traceId?: string; createdAt: string }
export interface Summary {
  windowDays: number; casesToday: number; casesTotal: number; casesResolved: number; autonomousResolutionRate: number; escalations: number; avgResolutionMs: number; firstResponseMs: number;
  recoveredRevenue: number; refundedRevenue: number; csat: number | null; agentHoursSaved: number; failedActions: number; pendingApprovals: number;
  autonomousVsHuman: { autonomous: number; human: number }; escalationReasons: { reason: string; count: number }[]; statusBreakdown: { status: string; count: number }[];
}
export interface TimePoint { date: string; cases: number; avgResolutionMs: number; autonomous: number; recovered: number; refunded: number }
export interface Notification { _id: string; kind: string; title: string; body: string; severity: "info" | "warning" | "error"; read: boolean; link?: string; createdAt: string }
export interface IntegrationRow { type: string; enabled: boolean; mode: string; configured: boolean; keyId?: string; lastTest?: { ok: boolean; message?: string; at: string } }
export interface PolicyDef { id: string; key: string; version: string; description: string; rules: { id: string; description: string; severity: string }[] }
export interface KnowledgeHit { docId: string; title: string; kind: string; text: string; score: number }

export interface AutomationProposal { caseId: string; decision: string; action: string; riskLevel: string; requiresHumanApproval: boolean }
export interface BackendDecision { allowed: boolean; code: string; reasons: string[]; backend: { amount: number; riskScore: number; riskLevel: RiskLevel; autoLimit: number; requiresApproval: boolean } }
export interface AutomationRun {
  _id: string; caseId: string; correlationId: string; requestedAction: string; actor: string; actorType: string; status: 'DISPATCHED' | 'SUCCEEDED' | 'FAILED' | 'BLOCKED' | 'VERIFICATION_FAILED';
  externalService: string | null; n8nExecutionId?: string | null; workflow: { name: string }; backendDecision: BackendDecision; rheaProposal?: AutomationProposal;
  verification?: { passed: boolean; checks: { name: string; passed: boolean }[] }; error?: { code: string; message: string }; createdAt: string; finishedAt?: string;
}
