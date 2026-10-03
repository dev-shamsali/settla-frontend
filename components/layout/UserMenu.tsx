"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector, authActions } from "@/store";
import { authApi } from "@/services";
import { tokenStore } from "@/services/apiClient";
import { titleCase } from "@/lib/utils";

export function UserMenu() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const out = async () => {
    try { await authApi.logout(); } catch { /* session may already be gone */ }
    tokenStore.set(null); dispatch(authActions.signedOut()); router.replace("/login");
  };
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right leading-tight md:block"><div className="text-xs font-medium">{user?.name}</div><div className="text-[10px] text-ink-muted">{user && titleCase(user.role)}</div></div>
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-100 text-xs font-semibold text-burgundy-700">{user?.name?.[0]}</span>
      <button onClick={out} aria-label="Sign out" className="rounded-lg p-2 text-ink-soft hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
    </div>
  );
}
