import Link from "next/link";

export const metadata = { title: "Single sign-on" };

export default function Callback() {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4">
      <div className="glass-strong max-w-md rounded-2xl p-8 text-center">
        <h1 className="font-display text-2xl">Single sign-on is not configured</h1>
        <p className="mt-2 text-sm text-ink-muted">The OIDC callback route is in place, but this deployment has no identity provider connected. Sign in with your email and password instead.</p>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Back to sign in</Link>
      </div>
    </main>
  );
}
