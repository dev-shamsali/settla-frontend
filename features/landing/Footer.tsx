import { Logo, NAV_LINKS } from "./shared";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-white/70">AI-powered payment resolution.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/75">
            {NAV_LINKS.map((l) => <li key={l.href}><a href={l.href} className="transition-colors hover:text-white">{l.label}</a></li>)}
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-7xl text-xs text-white/65">© 2026 Settla</p>
    </footer>
  );
}
