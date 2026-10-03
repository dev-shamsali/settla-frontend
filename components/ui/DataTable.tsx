"use client";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, EmptyState, ErrorState, SkeletonRows } from "./primitives";

export interface Col<T> { key: string; header: string; cell: (r: T) => React.ReactNode; sortKey?: string; className?: string; hideBelow?: "md" | "lg" }

/** Sticky-header table with sort, pagination, keyboard-activatable rows; collapses columns responsively inside a scroll container. */
export function DataTable<T extends { _id: string }>({ cols, rows, loading, error, onRetry, empty, onRowClick, sort, onSort, page, totalPages, total, onPage }: {
  cols: Col<T>[]; rows?: T[]; loading?: boolean; error?: unknown; onRetry?: () => void; empty: { title: string; body: string; icon?: React.ReactNode; action?: React.ReactNode };
  onRowClick?: (r: T) => void; sort?: { key: string; order: "asc" | "desc" }; onSort?: (key: string) => void; page?: number; totalPages?: number; total?: number; onPage?: (p: number) => void;
}) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (loading) return <SkeletonRows />;
  if (!rows?.length) return <EmptyState {...empty} />;
  return (
    <div>
      <div className="max-h-[68vh] overflow-auto rounded-xl border hairline bg-white/[0.05]">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort && sort.key === c.sortKey ? (sort.order === "asc" ? "ascending" : "descending") : undefined}
                  className={cn("sticky top-0 z-10 border-b hairline bg-paper/95 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted backdrop-blur", c.hideBelow === "md" && "hidden md:table-cell", c.hideBelow === "lg" && "hidden lg:table-cell", c.className)}>
                  {c.sortKey && onSort ? (
                    <button onClick={() => onSort(c.sortKey!)} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                      {c.header}{sort?.key === c.sortKey && (sort.order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} tabIndex={onRowClick ? 0 : undefined} onClick={() => onRowClick?.(r)}
                onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(r); } }}
                className={cn("group transition-colors", onRowClick && "cursor-pointer hover:bg-burgundy-50/70 focus-visible:bg-burgundy-50")}>
                {cols.map((c) => (
                  <td key={c.key} className={cn("border-b hairline px-3 py-3 align-middle", c.hideBelow === "md" && "hidden md:table-cell", c.hideBelow === "lg" && "hidden lg:table-cell", c.className)}>{c.cell(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPage && totalPages !== undefined && (
        <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
          <span>{total} total · page {page} of {Math.max(totalPages, 1)}</span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" aria-label="Previous page" disabled={(page ?? 1) <= 1} onClick={() => onPage((page ?? 1) - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="outline" aria-label="Next page" disabled={(page ?? 1) >= totalPages} onClick={() => onPage((page ?? 1) + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
