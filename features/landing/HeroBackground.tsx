"use client";
import { useEffect, useRef } from "react";

const DIR = "/hero/";
const COUNT = 96; // matches public/hero/manifest.json
const MAX_BITMAPS = 16; // decoded frames kept in memory (LRU); everything else stays compressed
const CONCURRENCY = 3;

const frameUrl = (i: number) => `${DIR}f_${String(i).padStart(3, "0")}.webp`;

type NetInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Scroll-scrubbed cinematic background drawn from a pre-extracted frame sequence.
 * Why: seeking an mp4 on every scroll tick forces the browser to decode from the previous keyframe (visible stutter).
 * Painting pre-decoded WebP frames on a canvas is constant-cost and lets us blend neighbouring frames for smooth motion.
 *
 * - frames load lazily after idle, first frame first; the page never waits for them (CSS poster shows instantly)
 * - ONE rAF loop, started by scroll, ended when converged or the tab hides; refs only, no React state
 * - ImageBitmap LRU keeps memory small; capped devicePixelRatio; no work when nothing changes
 * - skipped entirely for reduced-motion, data-saver / slow connections and narrow screens (poster only)
 */
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const conn = (navigator as Navigator & { connection?: NetInfo }).connection;
    const slow = conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || slow || window.innerWidth < 768) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let alive = true;
    let raf = 0;
    let target = 0; // 0..1 scroll progress
    let current = 0; // smoothed
    let lastDrawn = -1;
    const blobs: (Blob | null)[] = new Array(COUNT).fill(null);
    const pending = new Set<number>();
    const bitmaps = new Map<number, ImageBitmap>(); // insertion order == LRU order
    let cw = 0;
    let ch = 0;

    const progress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cw = Math.round(window.innerWidth * dpr);
      ch = Math.round(window.innerHeight * dpr);
      canvas.width = cw;
      canvas.height = ch;
      lastDrawn = -1;
      schedule();
    };

    const bitmapFor = (i: number): ImageBitmap | null => {
      const hit = bitmaps.get(i);
      if (hit) { bitmaps.delete(i); bitmaps.set(i, hit); return hit; } // refresh LRU position
      const blob = blobs[i];
      if (blob && !pending.has(i)) {
        pending.add(i);
        createImageBitmap(blob).then((bm) => {
          pending.delete(i);
          if (!alive) { bm.close(); return; }
          bitmaps.set(i, bm);
          while (bitmaps.size > MAX_BITMAPS) { const k = bitmaps.keys().next().value as number; bitmaps.get(k)?.close(); bitmaps.delete(k); }
          lastDrawn = -1;
          schedule();
        }).catch(() => pending.delete(i));
      }
      return null;
    };

    // nearest decoded frame to index i (so we never flash empty while a bitmap decodes)
    const nearest = (i: number): ImageBitmap | null => {
      for (let d = 0; d < COUNT; d += 1) {
        const a = bitmaps.get(i - d); if (a) return a;
        const b = bitmaps.get(i + d); if (b) return b;
        if (d > 6) break;
      }
      return null;
    };

    const drawCover = (bm: ImageBitmap, alpha: number) => {
      const s = Math.max(cw / bm.width, ch / bm.height);
      const dw = bm.width * s;
      const dh = bm.height * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(bm, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const draw = () => {
      const pos = current * (COUNT - 1);
      const i = Math.floor(pos);
      const f = pos - i;
      const key = Math.round(pos * 20); // skip redundant paints (1/20 frame steps)
      if (key === lastDrawn) return;
      const a = bitmapFor(i) ?? nearest(i);
      if (!a) return;
      lastDrawn = key;
      drawCover(a, 1);
      if (f > 0.04 && i + 1 < COUNT) { const b = bitmapFor(i + 1); if (b) drawCover(b, f); } // temporal blend = smoother motion
      ctx.globalAlpha = 1;
      bitmapFor(Math.min(COUNT - 1, i + 2)); // warm the next frames in scroll direction
      bitmapFor(Math.max(0, i - 1));
      if (canvas.dataset.ready !== "true") canvas.dataset.ready = "true";
    };

    const tick = () => {
      raf = 0;
      if (!alive || document.hidden) return;
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0003) current = target;
      draw();
      if (current !== target) raf = requestAnimationFrame(tick); // converged => loop stops (zero idle cost)
    };
    function schedule() { if (!raf && alive && !document.hidden) raf = requestAnimationFrame(tick); }

    const onScroll = () => { target = progress(); schedule(); };
    const onVisibility = () => { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else schedule(); };

    // ---- lazy, low-priority frame loading (first frame first, then spread outwards from the scroll position) ----
    const queue: number[] = [];
    let active = 0;
    const order = () => {
      const start = Math.round(progress() * (COUNT - 1));
      const idx = Array.from({ length: COUNT }, (_, k) => k).sort((x, y) => Math.abs(x - start) - Math.abs(y - start));
      return idx;
    };
    const pump = () => {
      while (alive && active < CONCURRENCY && queue.length) {
        const i = queue.shift() as number;
        if (blobs[i]) continue;
        active += 1;
        fetch(frameUrl(i), { priority: "low" } as RequestInit)
          .then((r) => (r.ok ? r.blob() : null))
          .then((b) => { if (b && alive) { blobs[i] = b; if (Math.abs(i - Math.round(current * (COUNT - 1))) <= 2) { lastDrawn = -1; schedule(); } } })
          .catch(() => {})
          .finally(() => { active -= 1; pump(); });
      }
    };

    const start = () => {
      if (!alive) return;
      resize();
      target = progress();
      current = target;
      queue.push(...order());
      pump();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", resize, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
    };

    const hasIdle = typeof window.requestIdleCallback === "function"; // Safari lacks it
    const idle = hasIdle ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 500);

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      if (hasIdle) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      bitmaps.forEach((b) => b.close());
      bitmaps.clear();
    };
  }, []);

  return (
    <div className="l-bg" aria-hidden="true">
      <div className="l-bg__poster" />
      <canvas ref={canvasRef} className="l-bg__video" />
      <div className="l-bg__overlay" />
      <div className="l-bg__grain" />
    </div>
  );
}
