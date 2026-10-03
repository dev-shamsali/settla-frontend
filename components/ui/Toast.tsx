"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type T = { id: number; kind: "success" | "error" | "info"; title: string; body?: string };
const Ctx = createContext<{ push: (t: Omit<T, "id">) => void }>({ push: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((t: Omit<T, "id">) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), t.kind === "error" ? 8000 : 4500);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} role="status" className={cn("glass-strong pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 text-sm")}>
            {t.kind === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-ok" /> : t.kind === "error" ? <XCircle className="mt-0.5 h-4 w-4 text-bad" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-warn" />}
            <div className="min-w-0 flex-1"><div className="font-medium text-ink">{t.title}</div>{t.body && <div className="mt-0.5 break-words text-xs text-ink-muted">{t.body}</div>}</div>
            <button aria-label="Dismiss" onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))} className="text-ink-muted hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
