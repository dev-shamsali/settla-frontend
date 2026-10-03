"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck, Scale, Gauge, UserRoundCheck, Plug2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const Reveal = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, ease: "easeOut" }}>{children}</motion.div>;
};
const Section = ({ id, eyebrow, title, lead, children, className }: { id?: string; eyebrow: string; title: string; lead?: string; children?: React.ReactNode; className?: string }) => (
  <section id={id} className={cn("mx-auto w-full max-w-6xl px-5 py-20 sm:px-8", className)}>
    <Reveal><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 max-w-3xl font-display text-3xl tracking-tight sm:text-4xl">{title}</h2>{lead && <p className="mt-3 max-w-2xl text-base text-ink-soft">{lead}</p>}</Reveal>
    {children && <div className="mt-10">{children}</div>}
  </section>
);

const STEPS = ["Observe", "Understand context", "Understand reason", "Decide", "Act", "Verify", "Follow up", "Learn"];
const PIPE = ["LLM proposes a structured plan", "JSON-schema validation", "Hard rules", "Policy engine", "Risk engine", "RBAC + limits", "Typed tool execution", "Read-after-write verification"];
const TIMELINE: [string, string][] = [["09:42:00", "WhatsApp message received"], ["09:42:02", "Customer identified"], ["09:42:04", "Razorpay payment found · ₹3,499"], ["09:42:06", "No Shopify order found"], ["09:42:08", "Cart matched"], ["09:42:10", "Policy recover-order-v2 passed · risk 0.08 LOW"], ["09:42:13", "Order created"], ["09:42:16", "Order verified"], ["09:42:19", "Customer notified"], ["09:42:23", "Freshdesk ticket closed"], ["09:42:27", "Outcome recorded · ₹3,499 recovered"]];

export function Landing() {
  return (
    <div>
      <header className="glass sticky top-0 z-30 rounded-none border-x-0 border-t-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-burgundy-600 font-display text-cream">S</span><span className="font-display text-lg">Settla</span></Link>
          <nav aria-label="Marketing" className="hidden items-center gap-6 text-sm text-ink-soft md:flex"><a href="#how" className="hover:text-ink">How it works</a><a href="#engine" className="hover:text-ink">Decision engine</a><a href="#security" className="hover:text-ink">Security</a><a href="#pricing" className="hover:text-ink">Pricing</a></nav>
          <Link href="/login" className="rounded-lg bg-ink px-4 py-1.5 text-sm font-medium text-cream hover:bg-ink-soft">Sign in</Link>
        </div>
      </header>

      <main id="main">
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
          <Reveal>
            <p className="eyebrow">Settla · Rhea, autonomous payment resolution</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">The AI teammate that settles <span className="text-burgundy-600">money debited, no order</span> cases end to end.</h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-soft">Rhea finds it. Rhea fixes it. Rhea checks it. Rhea closes it. And Rhea knows when to call a human.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#live" className="inline-flex h-11 items-center gap-2 rounded-lg bg-burgundy-600 px-6 text-sm font-medium text-white hover:bg-burgundy-700">View live resolution <ArrowRight className="h-4 w-4" /></Link>
              <Link href="#architecture" className="inline-flex h-11 items-center rounded-lg border hairline bg-white/60 px-6 text-sm font-medium hover:bg-white">Explore architecture</Link>
            </div>
          </Reveal>
        </section>

        <Section eyebrow="The problem" title="A customer pays. The bank debits. No order exists." lead="Today that becomes a ticket, a payment lookup, an OMS search, a refund-or-recover decision, a reply, and a CRM note — handled by hand, one tab at a time.">
          <div className="grid gap-4 sm:grid-cols-3">{[["Hours, not seconds", "Each case crosses four to six systems before anyone can decide."], ["Inconsistent outcomes", "Refund, recover, or wait depends on who picks it up."], ["Money at risk", "Duplicate orders and double refunds when handoffs go wrong."]].map(([t, d]) => <Reveal key={t}><div className="surface h-full rounded-2xl p-5"><h3 className="font-display text-xl">{t}</h3><p className="mt-2 text-sm text-ink-soft">{d}</p></div></Reveal>)}</div>
        </Section>

        <Section eyebrow="Why chatbots stop short" title="Answering is not resolving." lead="A chatbot can say “we are checking”. It cannot look up the payment, create the order, verify it exists, close the ticket, and know when it is out of its depth.">
          <div className="grid gap-4 md:grid-cols-2">
            <Reveal><div className="surface rounded-2xl p-6"><h3 className="eyebrow">Typical chatbot</h3><ul className="mt-3 space-y-2 text-sm text-ink-soft">{["Replies with a script", "Hands over to a human with no context", "Cannot touch payments or orders", "No proof anything was fixed"].map((x) => <li key={x} className="flex gap-2"><span className="text-bad">×</span>{x}</li>)}</ul></div></Reveal>
            <Reveal><div className="glass-strong rounded-2xl p-6"><h3 className="eyebrow text-burgundy-600">Rhea</h3><ul className="mt-3 space-y-2 text-sm">{["Investigates across gateway, OMS, CRM and ticketing", "Acts within policy, risk and permission limits", "Verifies every write by reading it back", "Escalates with the complete case file"].map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />{x}</li>)}</ul></div></Reveal>
          </div>
        </Section>

        <Section id="how" eyebrow="Meet Rhea · How it works" title="Eight steps, every case, every time.">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{STEPS.map((s, i) => <Reveal key={s}><li className="surface flex items-center gap-3 rounded-xl p-4"><span className="tabular flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-100 text-sm font-semibold text-burgundy-700">{i + 1}</span><span className="text-sm font-medium">{s}</span></li></Reveal>)}</ol>
        </Section>

        <Section id="engine" eyebrow="Decision engine" title="The model proposes. Rules decide." lead="Rhea can never execute a financial action directly. Every proposal passes through deterministic gates before a typed tool runs.">
          <Reveal><ol className="grid gap-2 md:grid-cols-4">{PIPE.map((p, i) => <li key={p} className="glass rounded-xl p-4 text-sm"><span className="tabular text-xs text-ink-muted">0{i + 1}</span><div className="mt-1 font-medium">{p}</div></li>)}</ol></Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">{["Recover order", "Refund", "Wait for auto-reversal", "Escalate"].map((d) => <div key={d} className="surface rounded-xl p-4 text-center text-sm font-medium">{d}</div>)}</div>
        </Section>

        <Section id="live" eyebrow="Live resolution timeline" title="27 seconds, start to verified finish." lead="Illustrative demo scenario on simulated data: UrbanStep Support, ₹3,499, payment pay_Q7xK2.">
          <Reveal><div className="glass-strong rounded-2xl p-6"><ol className="space-y-1">{TIMELINE.map(([t, e], i) => <motion.li key={t} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex gap-4 py-1.5 text-sm"><time className="tabular w-16 shrink-0 font-mono text-xs text-ink-muted">{t}</time><span className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-ok" />{e}</span></motion.li>)}</ol></div></Reveal>
        </Section>

        <Section eyebrow="Integrations" title="Vendor-neutral adapters." lead="One interface per capability. Swap a vendor without touching the decision engine.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{["Razorpay", "Shopify / OMS", "Freshdesk", "HubSpot", "WhatsApp", "Slack", "Email"].map((n) => <div key={n} className="surface flex h-16 items-center justify-center rounded-xl text-center text-sm font-medium"><Plug2 className="mr-1.5 h-3.5 w-3.5 text-burgundy-500" />{n}</div>)}</div>
        </Section>

        <Section eyebrow="Human escalation" title="Rhea knows when to stop." lead="Low confidence, high value, legal or chargeback language, systems that disagree, hostile customers, repeated failures. The human gets the full case file and never restarts the investigation.">
          <div className="grid gap-4 sm:grid-cols-3">{[[UserRoundCheck, "Complete case file", "Evidence, risk, policy, actions done and failed."], [Scale, "Approve, edit, reject", "Every sensitive action is audited and cannot be self-approved."], [Gauge, "Kill switch", "Flip a tenant to recommend-only instantly."]].map(([I, t, d]) => { const Icon = I as typeof Gauge; return <Reveal key={t as string}><div className="surface h-full rounded-2xl p-5"><Icon className="h-5 w-5 text-burgundy-600" /><h3 className="mt-3 font-display text-lg">{t as string}</h3><p className="mt-1 text-sm text-ink-soft">{d as string}</p></div></Reveal>; })}</div>
        </Section>

        <Section id="security" eyebrow="Security" title="Built for money." className="pb-8">
          <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">{["Tenant isolation derived from identity, never request bodies", "RBAC re-read from the database on every request", "Idempotency keys on every financial action", "Gateway-authoritative amounts; the client is never trusted", "Signed, timestamped, replay-protected webhooks", "Customer text is data, not instructions (prompt-injection defences)", "Append-only audit log with secrets redacted", "Read-after-write verification with safe compensation"].map((x) => <div key={x} className="flex gap-2 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-burgundy-600" />{x}</div>)}</div>
        </Section>

        <Section eyebrow="Impact" title="What you can measure." lead="Dashboards report measured values only. The figures below are demo seed data, not customer results.">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[["27s", "demo resolution"], ["0.08", "demo risk score"], ["100%", "writes verified"], ["≤ ₹5,000", "auto-execution limit"]].map(([v, l]) => <div key={l} className="surface rounded-2xl p-5"><div className="font-display text-3xl">{v}</div><div className="mt-1 text-xs text-ink-muted">{l}</div></div>)}</div>
        </Section>

        <Section id="architecture" eyebrow="Architecture" title="Two repositories. One contract.">
          <Reveal><div className="glass rounded-2xl p-6"><div className="grid items-center gap-3 text-center text-sm md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">{["Next.js console", "REST + SSE", "Express API · RBAC · policy · risk · idempotency", "Rhea planner + typed tools", "MongoDB · BullMQ · OTel", "Adapters", "Razorpay · Shopify · Freshdesk · HubSpot · WhatsApp · Slack"].map((x, i) => i % 2 === 1 ? <GitBranch key={i} className="mx-auto hidden h-4 w-4 text-ink-muted md:block" aria-hidden /> : <div key={i} className="rounded-xl border hairline bg-white/70 p-3">{x}</div>)}</div></div></Reveal>
        </Section>

        <Section id="pricing" eyebrow="Pricing" title="Simple, usage-aligned." lead="Illustrative structure — final pricing to be confirmed.">
          <div className="grid gap-4 md:grid-cols-3">{[["Pilot", "Recommend-only", "Rhea investigates and recommends. No sensitive actions."], ["Autonomous", "Per resolved case", "Rhea acts within your limits and verifies outcomes."], ["Enterprise", "Custom", "SSO, dedicated tenancy, custom policies and integrations."]].map(([n, p, d], i) => <div key={n} className={cn("rounded-2xl p-6", i === 1 ? "glass-strong ring-1 ring-burgundy-500/30" : "surface")}><h3 className="font-display text-xl">{n}</h3><div className="mt-1 text-sm font-medium text-burgundy-700">{p}</div><p className="mt-3 text-sm text-ink-soft">{d}</p></div>)}</div>
        </Section>

        <Section eyebrow="Roadmap" title="Where this goes next.">
          <ol className="grid gap-3 md:grid-cols-4">{[["Now", "Money debited, no order"], ["Next", "Duplicate-charge and failed-refund cases"], ["Then", "Chargeback evidence packs"], ["Later", "Cross-channel resolution playbooks"]].map(([w, t]) => <li key={w} className="surface rounded-xl p-4"><div className="eyebrow">{w}</div><div className="mt-1 text-sm font-medium">{t}</div></li>)}</ol>
        </Section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8"><Reveal><div className="glass-strong rounded-3xl p-10 text-center sm:p-14"><h2 className="font-display text-3xl sm:text-4xl">Let Rhea take the next one.</h2><p className="mx-auto mt-3 max-w-xl text-ink-soft">Start in recommend-only mode and move to autonomous when you trust the evidence.</p><Link href="/login" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-burgundy-600 px-6 text-sm font-medium text-white hover:bg-burgundy-700">Open the console <ArrowRight className="h-4 w-4" /></Link></div></Reveal></section>
      </main>
      <footer className="border-t hairline px-5 py-8 text-center text-xs text-ink-muted"><Link href="/presentation" className="hover:text-ink">Presentation</Link> · <Link href="/privacy" className="hover:text-ink">Privacy</Link> · <Link href="/terms" className="hover:text-ink">Terms</Link> · © Settla</footer>
    </div>
  );
}
