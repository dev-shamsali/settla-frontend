"use client";
import * as React from "react";
import { cn, titleCase } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/* ---------- Button ---------- */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-burgundy-600 text-white hover:brightness-110 shadow-sm shadow-burgundy-900/20",
  secondary: "bg-white/10 text-ink hover:bg-white/15",
  outline: "border hairline bg-white/[0.05] text-ink hover:bg-white/[0.05]",
  ghost: "text-ink-soft hover:bg-white/10",
  danger: "bg-bad text-white hover:brightness-110",
};
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; loading?: boolean }>(
  function Button({ className, variant = "primary", size = "md", loading, disabled, children, ...p }, ref) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-8 px-3 text-xs" : size === "lg" ? "h-11 px-6 text-sm" : "h-9 px-4 text-sm",
          btnStyles[variant], className,
        )}
        {...p}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);

/* ---------- Badges ---------- */
const tones = {
  neutral: "bg-white/[0.07] text-ink-soft",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  brand: "bg-burgundy-100 text-burgundy-700",
} as const;
export type Tone = keyof typeof tones;
export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  RESOLVED: "ok", REFUNDED: "ok", CLOSED: "neutral", FAILED: "bad", ESCALATED: "warn", AWAITING_APPROVAL: "warn", WAITING_REVERSAL: "info",
  NEW: "neutral", OBSERVING: "info", INVESTIGATING: "info", DECIDING: "info", EXECUTING: "brand", VERIFYING: "brand",
};
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={statusTone[status] ?? "neutral"} dot>{titleCase(status)}</Badge>;
export const RiskBadge = ({ level, score }: { level?: string | null; score?: number }) =>
  !level ? <span className="text-ink-muted">—</span> : (
    <Badge tone={level === "LOW" ? "ok" : level === "MEDIUM" ? "warn" : "bad"}>{level}{score !== undefined ? ` · ${score.toFixed(2)}` : ""}</Badge>
  );
export const DemoBadge = () => <Badge tone="info">Demo data</Badge>;

/* ---------- Panels ---------- */
export function Panel({ className, children, strong }: { className?: string; children: React.ReactNode; strong?: boolean }) {
  return <section className={cn("rounded-2xl p-5", strong ? "glass-strong" : "glass", className)}>{children}</section>;
}
export function PanelHeader({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Form ---------- */
const field = "w-full rounded-lg border hairline bg-white/[0.05] px-3 text-sm text-ink placeholder:text-ink-muted/70 focus-visible:border-burgundy-500";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, "h-9", className)} {...p} />;
});
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(field, "min-h-20 py-2", className)} {...p} />;
});
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(field, "h-9 pr-8", className)} {...p} />;
});
export function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink-soft">{label}</label>
      {children}
      {error && <p role="alert" className="text-xs text-bad">{error}</p>}
    </div>
  );
}

/* ---------- Feedback states ---------- */
export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton", className)} aria-hidden />;
export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return <div role="status" aria-label="Loading" className="space-y-2">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>;
}
export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-burgundy-50 text-burgundy-600">{icon}</div>}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-md text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const e = error as { code?: string; message?: string; status?: number; requestId?: string };
  const denied = e?.status === 403;
  const offline = e?.code === "NETWORK_ERROR";
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <h3 className="font-display text-xl text-ink">{denied ? "Permission denied" : offline ? "You appear to be offline" : e?.status === 404 ? "Not found" : "Something went wrong"}</h3>
      <p className="mt-1.5 max-w-md text-sm text-ink-muted">{denied ? "Your role does not include access to this area. Ask a tenant admin if you need it." : e?.message ?? "Unexpected error."}</p>
      {e?.requestId && <p className="mt-2 font-mono text-[11px] text-ink-muted">request {e.requestId}</p>}
      {onRetry && !denied && <Button variant="outline" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/* ---------- Stat ---------- */
export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={cn("tabular mt-1 font-display text-3xl tracking-tight", tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "bad" && "text-bad")}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

export function KV({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-ink-muted">{k}</dt>
      <dd className={cn("text-right text-ink", mono && "font-mono text-xs")}>{v}</dd>
    </div>
  );
}
