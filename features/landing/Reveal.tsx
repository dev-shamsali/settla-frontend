"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** One-shot IntersectionObserver reveal (opacity + translateY). Visible immediately if IO is unavailable. */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.classList.add("is-visible"); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const props = { ref: ref as never, className: cn("l-reveal", className), style: delay ? { transitionDelay: `${delay}ms` } : undefined };
  return <Tag {...props}>{children}</Tag>;
}
