"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, CornerDownLeft } from "lucide-react";
import { useAppDispatch, useAppSelector, uiActions } from "@/store";
import { casesApi, customersApi } from "@/services";
import { NAV } from "./nav";
import { cn } from "@/lib/utils";

interface Cmd { id: string; label: string; hint?: string; to: string }

const NO_PERMS: string[] = [];

export function CommandPalette() {
  const open = useAppSelector((s) => s.ui.paletteOpen);
  return open ? <PaletteInner /> : null;
}

function PaletteInner() {
  const open = true;
  const perms = useAppSelector((s) => s.auth.user?.permissions) ?? NO_PERMS;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 250); return () => clearTimeout(t); }, [q]);

  const canCases = perms.includes("cases:read");
  const cases = useQuery({ queryKey: ["palette-cases", dq], queryFn: () => casesApi.list({ search: dq, pageSize: 5 }), enabled: open && dq.length >= 2 && canCases });
  const customers = useQuery({ queryKey: ["palette-customers", dq], queryFn: () => customersApi.list({ search: dq, pageSize: 4 }), enabled: open && dq.length >= 2 && perms.includes("customers:read") });

  const cmds = useMemo<Cmd[]>(() => {
    const nav = NAV.filter((n) => !n.perm || perms.includes(n.perm)).map((n) => ({ id: n.href, label: n.label, hint: "Go to", to: n.href }));
    const actions: Cmd[] = [
      ...(perms.includes("cases:create") ? [{ id: "create", label: "Create case", hint: "Action", to: "/cases?new=1" }] : []),
      ...(perms.includes("analytics:read") ? [{ id: "analytics", label: "View analytics", hint: "Action", to: "/analytics" }] : []),
    ];
    const live: Cmd[] = [
      ...(cases.data?.items ?? []).map((c) => ({ id: `c-${c._id}`, label: `${c.caseNumber} · ${c.customerName ?? c.paymentId}`, hint: "Case", to: `/cases/${c._id}` })),
      ...(customers.data?.items ?? []).map((c) => ({ id: `u-${c._id}`, label: c.name, hint: "Customer", to: `/customers/${c._id}` })),
      ...(dq.startsWith("pay_") && perms.includes("payments:read") ? [{ id: "p", label: `Open payment ${dq}`, hint: "Payment", to: `/payments/${dq}` }] : []),
    ];
    const needle = q.trim().toLowerCase();
    const filtered = [...actions, ...nav].filter((c) => !needle || c.label.toLowerCase().includes(needle));
    return [...live, ...filtered];
  }, [q, dq, perms, cases.data, customers.data]);

  const close = () => dispatch(uiActions.palette(false));
  const go = (c: Cmd) => { close(); router.push(c.to); };
  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={close} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, cmds.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter" && cmds[idx]) go(cmds[idx]);
        }}>
        <div className="flex items-center gap-3 border-b hairline px-4">
          <Search className="h-4 w-4 text-ink-muted" aria-hidden />
          <input ref={input} autoFocus value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder="Search cases, customers, payments (pay_…), or jump to a page"
            aria-label="Command search" role="combobox" aria-expanded aria-controls="cmd-list" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted" />
        </div>
        <ul id="cmd-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {cmds.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-muted">No matches</li>}
          {cmds.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === idx} onMouseEnter={() => setIdx(i)} onClick={() => go(c)}
              className={cn("flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm", i === idx ? "bg-burgundy-100 text-burgundy-800" : "text-ink-soft")}>
              <span className="truncate">{c.label}</span>
              <span className="flex items-center gap-2 text-xs text-ink-muted">{c.hint}{i === idx && <CornerDownLeft className="h-3 w-3" />}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
