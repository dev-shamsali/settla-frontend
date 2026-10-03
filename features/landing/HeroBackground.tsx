"use client";
import { useEffect, useRef } from "react";

const VIDEO_SRC = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4";

type NetInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Fixed cinematic background, fully isolated from the rest of the page.
 * - poster layer paints instantly (pure CSS, no network)
 * - the video is attached only after idle, never autoplays, and is scroll-scrubbed
 * - ONE rAF loop, started by scroll and stopped as soon as it converges or the tab hides
 * - no React state updates in the loop (refs only), passive scroll listener
 * - skipped entirely for reduced-motion, save-data / slow connections and narrow screens
 */
export function HeroBackground() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: NetInfo }).connection;
    const slow = conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || slow || window.innerWidth < 768) return; // poster-only experience

    let raf = 0;
    let target = 0; // 0..1 from scroll
    let current = 0; // smoothed
    let lastSet = -1;
    let lastSeekAt = 0;
    const SEEK_INTERVAL_MS = 110; // seeking is the expensive part (decodes from the previous keyframe): cap ~9/s
    const MIN_STEP_S = 0.08;
    let ready = false;
    let cancelled = false;

    const progress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const tick = () => {
      raf = 0;
      if (!ready || document.hidden) return;
      current += (target - current) * 0.1; // lightweight smoothing
      const t = current * (v.duration || 0);
      // seek only when the change is visible and the decoder is idle: avoids seek storms
      const now = performance.now();
      if (!v.seeking && now - lastSeekAt > SEEK_INTERVAL_MS && Math.abs(t - lastSet) > MIN_STEP_S) { v.currentTime = t; lastSet = t; lastSeekAt = now; }
      if (Math.abs(target - current) > 0.0008) raf = requestAnimationFrame(tick); // converged => loop ends
    };
    const kick = () => { if (!raf && ready && !document.hidden) raf = requestAnimationFrame(tick); };
    const onScroll = () => { target = progress(); kick(); };
    const onVisibility = () => { if (document.hidden) stop(); else kick(); };

    const attach = () => {
      if (cancelled) return;
      v.muted = true;
      v.preload = "metadata";
      v.src = VIDEO_SRC;
      v.addEventListener("loadedmetadata", () => { ready = true; v.currentTime = 0.01; }, { once: true });
      v.addEventListener("loadeddata", () => { v.dataset.ready = "true"; v.pause(); target = progress(); current = target; kick(); }, { once: true });
      v.addEventListener("error", () => { v.removeAttribute("src"); v.load(); }, { once: true }); // poster stays
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
    };

    // never compete with first paint / LCP
    const hasIdle = typeof window.requestIdleCallback === "function"; // Safari lacks it
    const idle = hasIdle ? window.requestIdleCallback(attach, { timeout: 2500 }) : window.setTimeout(attach, 900);

    return () => {
      cancelled = true;
      stop();
      if (hasIdle) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      v.removeAttribute("src");
      v.load(); // release decoder + buffered data
    };
  }, []);

  return (
    <div className="l-bg" aria-hidden="true">
      <div className="l-bg__poster" />
      <video ref={video} className="l-bg__video" muted playsInline preload="none" tabIndex={-1} disablePictureInPicture disableRemotePlayback />
      <div className="l-bg__overlay" />
      <div className="l-bg__grain" />
    </div>
  );
}
