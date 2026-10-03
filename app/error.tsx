"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 text-center">
      <div role="alert"><h1 className="font-display text-3xl">Something went wrong</h1><p className="mt-2 max-w-md text-sm text-ink-muted">The page failed to render. Nothing was changed. {error.digest && <span className="font-mono text-xs">ref {error.digest}</span>}</p>
        <button onClick={reset} className="mt-5 rounded-lg bg-burgundy-600 px-4 py-2 text-sm font-medium text-white">Try again</button></div>
    </main>
  );
}
