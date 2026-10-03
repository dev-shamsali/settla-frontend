"use client";
import { useEffect } from "react";

const STALE_BUNDLE = /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch dynamically|Importing a module script failed/i;

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // After the app is redeployed/rebuilt, an open tab still holds old script names. Reload once to pick up the new build.
  useEffect(() => {
    if (!STALE_BUNDLE.test(`${error.name} ${error.message}`)) return;
    try {
      if (sessionStorage.getItem("settla-reloaded") === "1") return;
      sessionStorage.setItem("settla-reloaded", "1");
    } catch { /* storage blocked: fall through to manual retry */ }
    window.location.reload();
  }, [error]);

  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 text-center">
      <div role="alert">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-ink-muted">This page failed to load. Nothing was changed. If the app was just updated, reloading fixes it. {error.digest && <span className="font-mono text-xs">ref {error.digest}</span>}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={reset} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:brightness-110">Try again</button>
          <button onClick={() => window.location.reload()} className="rounded-lg border hairline px-4 py-2 text-sm text-ink hover:bg-white/10">Reload page</button>
        </div>
      </div>
    </main>
  );
}
