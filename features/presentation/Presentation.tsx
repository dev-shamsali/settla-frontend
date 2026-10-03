"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Maximize2, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { SLIDES } from "./slides";

/** Keyboard-driven deck: ←/→ navigate, S speaker notes, F fullscreen, Home/End jump. */
export function Presentation() {
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(true);
  const go = useCallback((n: number) => setI(Math.min(SLIDES.length - 1, Math.max(0, n))), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(i + 1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(i - 1); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(SLIDES.length - 1);
      else if (e.key.toLowerCase() === "s") setNotes((v) => !v);
      else if (e.key.toLowerCase() === "f") { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  const s = SLIDES[i];
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-3 text-xs text-ink-muted sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-ink"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-burgundy-600 text-cream">S</span>Settla</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-md border hairline bg-white/[0.05] px-3 py-1.5 font-medium text-ink hover:bg-white/[0.05]">Open live demo</Link>
          <button onClick={() => setNotes((v) => !v)} aria-pressed={notes} className="inline-flex items-center gap-1.5 rounded-md border hairline bg-white/[0.05] px-3 py-1.5 hover:bg-white/[0.05]"><MessageSquareText className="h-3.5 w-3.5" aria-hidden />Speech (S)</button>
          <button onClick={() => void document.documentElement.requestFullscreen?.()} aria-label="Fullscreen (F)" className="rounded-md border hairline bg-white/[0.05] p-1.5 hover:bg-white/[0.05]"><Maximize2 className="h-3.5 w-3.5" /></button>
        </div>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 pb-6 sm:px-8 lg:flex-row">
        <section aria-live="polite" aria-label={`Slide ${i + 1} of ${SLIDES.length}`} className="glass-strong flex min-h-[60vh] flex-1 flex-col justify-center rounded-3xl p-8 sm:p-12">
          <p className="eyebrow">{s.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">{s.title}</h1>
          <div className="mt-8">{s.body}</div>
        </section>

        {notes && (
          <aside aria-label="Speech" className="lg:w-[340px]">
            <div className="glass rounded-2xl p-5 lg:sticky lg:top-6">
              <div className="eyebrow">What to say · slide {i + 1}</div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{s.speech}</p>
            </div>
          </aside>
        )}
      </main>

      <footer className="flex items-center justify-between gap-4 px-5 pb-5 sm:px-8">
        <button onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous slide" className="rounded-lg border hairline bg-white/[0.05] p-2 hover:bg-white/[0.05] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        <ol className="flex flex-wrap justify-center gap-1.5" aria-label="Slides">
          {SLIDES.map((x, n) => <li key={x.id}><button onClick={() => go(n)} aria-label={`Go to slide ${n + 1}: ${x.eyebrow}`} aria-current={n === i ? "step" : undefined} className={cn("h-2 rounded-full transition-all", n === i ? "w-8 bg-burgundy-600" : "w-2 bg-ink/20 hover:bg-black/70")} /></li>)}
        </ol>
        <button onClick={() => go(i + 1)} disabled={i === SLIDES.length - 1} aria-label="Next slide" className="rounded-lg border hairline bg-white/[0.05] p-2 hover:bg-white/[0.05] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </footer>
    </div>
  );
}
