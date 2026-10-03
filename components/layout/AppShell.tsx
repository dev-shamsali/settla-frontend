"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector, authActions, uiActions } from "@/store";
import { authApi } from "@/services";
import { refreshSession, setAuthLostHandler, tokenStore } from "@/services/apiClient";
import { openStream } from "@/lib/sse";
import type { CaseEvent } from "@/types/api";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsHelp, useShortcuts } from "./Shortcuts";
import { NotificationCenter } from "./NotificationCenter";
import { ModeSwitch } from "./ModeSwitch";
import { UserMenu } from "./UserMenu";
import { Skeleton } from "@/components/ui/primitives";
import { LogoMark } from "@/components/ui/Logo";

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
      <LogoMark size={32} />
      <span className="text-[17px] font-medium tracking-tight text-white">Settla</span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const perms = useAppSelector((s) => s.auth.user?.permissions) ?? [];
  const groups = ["Operate", "Records", "Govern", "System"] as const;
  return (
    <nav aria-label="Primary" className="mt-6 flex-1 space-y-5 overflow-y-auto px-2">
      {groups.map((g) => {
        const items = NAV.filter((n) => n.group === g && (!n.perm || perms.includes(n.perm)));
        if (!items.length) return null;
        return (
          <div key={g}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/40">{g}</div>
            {items.map((n) => {
              const active = path === n.href || path.startsWith(n.href + "/");
              return (
                <Link key={n.href} href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-white/[0.05] text-white" : "text-cream/65 hover:bg-white/[0.05] hover:text-white")}>
                  <n.icon className="h-4 w-4 shrink-0" aria-hidden />{n.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const qc = useQueryClient();
  const status = useAppSelector((s) => s.auth.status);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const tenant = useAppSelector((s) => s.auth.tenant);
  useShortcuts();

  useEffect(() => {
    setAuthLostHandler(() => { tokenStore.set(null); dispatch(authActions.signedOut()); router.replace("/login"); });
    let alive = true;
    (async () => {
      if (!tokenStore.get() && !(await refreshSession())) { if (alive) { dispatch(authActions.signedOut()); router.replace("/login"); } return; }
      try { const me = await authApi.me(); if (alive) dispatch(authActions.signedIn(me)); } catch { if (alive) { dispatch(authActions.signedOut()); router.replace("/login"); } }
    })();
    return () => { alive = false; };
  }, [dispatch, router]);

  useEffect(() => {
    if (status !== "authed") return;
    return openStream(
      (m) => {
        if (m.event === "case.event") { dispatch(uiActions.liveEvent((m.data as unknown as { event: CaseEvent }).event)); }
        if (m.event.startsWith("case.") || m.event === "action.state") { void qc.invalidateQueries({ queryKey: ["case"] }); void qc.invalidateQueries({ queryKey: ["cases"] }); void qc.invalidateQueries({ queryKey: ["summary"] }); }
        if (m.event === "notification") { void qc.invalidateQueries({ queryKey: ["notifications"] }); void qc.invalidateQueries({ queryKey: ["approvals"] }); void qc.invalidateQueries({ queryKey: ["escalations"] }); }
        if (m.event === "tenant.mode") dispatch(authActions.modeChanged((m.data as { mode: "AUTONOMOUS" | "RECOMMEND_ONLY" | "DISABLED" }).mode));
      },
      (s) => dispatch(uiActions.streamState(s)),
    );
  }, [status, dispatch, qc]);

  if (status !== "authed") {
    return <div className="grid min-h-screen place-items-center"><div className="w-64 space-y-3"><Skeleton className="h-8" /><Skeleton className="h-4 w-40" /></div></div>;
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="glass-dark fixed inset-y-0 left-0 z-30 hidden w-64 flex-col py-5 lg:flex"><Brand /><SidebarNav /><div className="px-5 pt-4 text-[11px] text-cream/40">{tenant?.name}</div></aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <div className="absolute inset-0 bg-black/70" onClick={() => dispatch(uiActions.sidebar(false))} aria-hidden />
          <aside className="glass-dark relative flex h-full w-72 flex-col py-5" aria-label="Navigation drawer">
            <button aria-label="Close menu" className="absolute right-3 top-3 text-cream/70" onClick={() => dispatch(uiActions.sidebar(false))}><X className="h-5 w-5" /></button>
            <Brand /><SidebarNav onNavigate={() => dispatch(uiActions.sidebar(false))} />
          </aside>
        </div>
      )}
      <header className="glass sticky top-0 z-20 flex h-14 items-center gap-2 rounded-none border-x-0 border-t-0 px-3 sm:px-6">
        <button aria-label="Open menu" className="rounded-md p-2 hover:bg-white/10 lg:hidden" onClick={() => dispatch(uiActions.sidebar(true))}><Menu className="h-5 w-5" /></button>
        <button onClick={() => dispatch(uiActions.palette(true))} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border hairline bg-white/[0.05] px-3 text-left text-sm text-ink-muted hover:bg-white/[0.05] sm:max-w-sm sm:flex-none sm:basis-80">
          <Search className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">Search or jump to…</span><kbd className="ml-auto hidden rounded border hairline px-1.5 font-mono text-[10px] sm:block">Ctrl K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2"><ModeSwitch /><NotificationCenter /><UserMenu /></div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      <CommandPalette />
      <ShortcutsHelp />
    </div>
  );
}
