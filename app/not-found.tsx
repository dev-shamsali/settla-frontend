import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 text-center">
      <div><p className="eyebrow">404</p><h1 className="mt-2 font-display text-4xl">That page doesn&apos;t exist</h1><p className="mt-2 text-sm text-ink-muted">It may have moved, or you may not have access.</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-burgundy-600 px-4 py-2 text-sm font-medium text-white">Go to dashboard</Link></div>
    </main>
  );
}
