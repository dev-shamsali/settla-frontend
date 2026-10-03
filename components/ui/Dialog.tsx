"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

/** Accessible modal: focus moves in, Esc closes, focus returns, body scroll locked. Drawer variant slides from the right. */
export function Dialog({ open, onClose, title, children, footer, drawer, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; drawer?: boolean; wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && el) {
        const f = el.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex" role="presentation">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className={cn("glass-strong relative z-10 flex max-h-[92vh] flex-col outline-none", drawer ? "ml-auto h-full w-full max-w-md rounded-none sm:rounded-l-2xl" : cn("m-auto w-[calc(100vw-2rem)] rounded-2xl", wide ? "max-w-2xl" : "max-w-lg"))}
      >
        <div className="flex items-center justify-between border-b hairline px-5 py-4">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="rounded-md p-1 text-ink-muted hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t hairline px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Financial confirmation: always shows the full action context before anything executes. */
export function FinancialConfirm({ open, onClose, onConfirm, loading, rows, title = "Confirm financial action", confirmLabel, danger }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading?: boolean; title?: string; confirmLabel: string; danger?: boolean;
  rows: { k: string; v: React.ReactNode }[];
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <dl className="divide-y hairline rounded-xl border hairline bg-white/60 px-4">
        {rows.map((r) => <div key={r.k} className="flex justify-between gap-4 py-2.5 text-sm"><dt className="text-ink-muted">{r.k}</dt><dd className="text-right font-medium text-ink">{r.v}</dd></div>)}
      </dl>
      <p className="mt-3 text-xs text-ink-muted">The backend re-derives the amount from the payment gateway, enforces policy and permissions, and verifies the result. This screen only reports what the backend confirms.</p>
    </Dialog>
  );
}
