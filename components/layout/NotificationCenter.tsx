"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/services";
import { ago, cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/primitives";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list, refetchInterval: 60000 });
  const read = useMutation({ mutationFn: notificationsApi.read, onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  const unread = data?.items.filter((n) => !n.read).length ?? 0;
  return (
    <>
      <button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} onClick={() => setOpen(true)} className="relative rounded-lg p-2 text-ink-soft hover:bg-black/5">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy-600 px-1 text-[10px] font-semibold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Notifications" drawer>
        {!data?.items.length ? <EmptyState title="All clear" body="Escalations, approvals, failed actions and integration problems will appear here." /> : (
          <ul className="space-y-2">
            {data.items.map((n) => (
              <li key={n._id} className={cn("rounded-xl border hairline p-3 text-sm", n.read ? "bg-white/40" : "bg-white/90")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-ink-muted">{n.body} · {ago(n.createdAt)}</div>
                  </div>
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", n.severity === "error" ? "bg-bad" : n.severity === "warning" ? "bg-warn" : "bg-info")} aria-label={n.severity} />
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  {n.link && <Link href={n.link} onClick={() => setOpen(false)} className="font-medium text-burgundy-600 hover:underline">Open</Link>}
                  {!n.read && <button onClick={() => read.mutate(n._id)} className="text-ink-muted hover:text-ink">Mark read</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
