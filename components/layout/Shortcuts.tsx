"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector, uiActions } from "@/store";
import { Dialog } from "@/components/ui/Dialog";

export const SHORTCUTS: { keys: string; label: string; to?: string }[] = [
  { keys: "g d", label: "Go to dashboard", to: "/dashboard" },
  { keys: "g c", label: "Go to cases", to: "/cases" },
  { keys: "g a", label: "Go to approvals", to: "/approvals" },
  { keys: "g e", label: "Go to escalations", to: "/escalations" },
  { keys: "g p", label: "Go to payments", to: "/payments" },
  { keys: "Ctrl/⌘ K", label: "Open command palette" },
  { keys: "?", label: "Show this help" },
];

export function useShortcuts() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pending = useRef<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dispatch(uiActions.palette(true)); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") { dispatch(uiActions.shortcuts(true)); return; }
      if (pending.current === "g") {
        const hit = SHORTCUTS.find((s) => s.keys === `g ${e.key}`);
        pending.current = null;
        if (hit?.to) router.push(hit.to);
        return;
      }
      if (e.key === "g") { pending.current = "g"; clearTimeout(t); t = setTimeout(() => { pending.current = null; }, 1200); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [router, dispatch]);
}

export function ShortcutsHelp() {
  const open = useAppSelector((s) => s.ui.shortcutsOpen);
  const dispatch = useAppDispatch();
  return (
    <Dialog open={open} onClose={() => dispatch(uiActions.shortcuts(false))} title="Keyboard shortcuts">
      <ul className="divide-y hairline">
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className="flex items-center justify-between py-2.5 text-sm">
            <span>{s.label}</span><span className="flex gap-1">{s.keys.split(" ").map((k) => <kbd key={k} className="rounded border hairline bg-white/70 px-1.5 py-0.5 font-mono text-xs">{k}</kbd>)}</span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
