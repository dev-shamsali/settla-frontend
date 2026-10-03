"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo, NAV_LINKS } from "./shared";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="l-nav fixed inset-x-0 top-0 z-50">
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-16">
        <Logo />
        <ul className="hidden items-center gap-9 text-sm text-white/75 md:flex">
          {NAV_LINKS.map((l) => <li key={l.href}><a href={l.href} className="transition-colors hover:text-white">{l.label}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden px-3 py-2 text-sm text-white/75 transition-colors hover:text-white sm:block">Sign in</Link>
          <a href="#contact" className="hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/85 sm:block">Request Demo</a>
          <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)} className="rounded-md p-2 text-white md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-black/90 px-5 pb-5 pt-2 md:hidden">
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => <li key={l.href}><a href={l.href} onClick={() => setOpen(false)} className="block border-b border-white/10 py-3.5 text-base text-white/80">{l.label}</a></li>)}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/login" className="rounded-full border border-white/20 py-2.5 text-center text-sm">Sign in</Link>
            <a href="#contact" onClick={() => setOpen(false)} className="rounded-full bg-white py-2.5 text-center text-sm font-medium text-black">Request Demo</a>
          </div>
        </div>
      )}
    </header>
  );
}
