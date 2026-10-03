import Link from "next/link";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section id="contact" aria-labelledby="cta-title" className="mx-auto flex min-h-[80svh] w-full max-w-4xl flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
      <Reveal><h2 id="cta-title" className="text-4xl font-light leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-7xl">Turn payment problems<br />into resolved conversations.</h2></Reveal>
      <Reveal delay={100}><p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">Give your support and payment teams an AI resolution layer that works within your rules.</p></Reveal>
      <Reveal delay={180} className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-white/85">Request a Demo</Link>
        <Link href="/presentation" className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-8 text-sm text-white transition-colors hover:bg-white/10">Explore Settla</Link>
      </Reveal>
    </section>
  );
}
