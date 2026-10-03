import Link from "next/link";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-16">
      <Link href="/" className="text-sm text-burgundy-700 hover:underline">← Settla</Link>
      <h1 className="mt-6 font-display text-4xl">{title}</h1>
      <p className="mt-1 text-xs text-ink-muted">{updated}</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink">{children}</div>
    </main>
  );
}
