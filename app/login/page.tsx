"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/services";
import { tokenStore } from "@/services/apiClient";
import { useAppDispatch, authActions } from "@/store";
import { Button, Field, Input } from "@/components/ui/primitives";

const schema = z.object({ email: z.string().min(1, "Email is required").email("Enter a valid email"), password: z.string().min(1, "Password is required") });
type F = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });
  const onSubmit = async (v: F) => {
    setError(null);
    try {
      const r = await authApi.login(v.email, v.password);
      tokenStore.set(r.accessToken);
      dispatch(authActions.signedIn({ user: r.user, tenant: r.tenant }));
      router.replace("/dashboard");
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setError(err.code === "NETWORK_ERROR" ? err.message ?? "Network error" : err.code === "RATE_LIMITED" ? "Too many attempts. Wait a minute and try again." : err.code === "TENANT_DISABLED" ? "This workspace is disabled." : "Email or password is incorrect.");
    }
  };
  return (
    <main id="main" className="grid min-h-screen lg:grid-cols-2">
      <section className="glass-dark relative hidden flex-col justify-between p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-600 font-display text-xl text-cream">S</span><span className="font-display text-2xl text-cream">Settla</span></Link>
        <div><p className="font-display text-4xl leading-tight text-cream">Rhea finds it.<br />Rhea fixes it.<br />Rhea checks it.<br />Rhea closes it.</p><p className="mt-5 max-w-sm text-sm text-cream/60">And knows exactly when to call a human.</p></div>
        <p className="text-xs text-cream/40">Money debited, no order — settled end to end.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="glass-strong w-full max-w-md rounded-2xl p-8">
          <h1 className="font-display text-3xl">Sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">Access your Settla operations console.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <Field label="Work email" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" autoComplete="username" aria-invalid={!!errors.email} {...register("email")} /></Field>
            <Field label="Password" htmlFor="password" error={errors.password?.message}><Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} /></Field>
            {error && <p role="alert" className="rounded-lg bg-bad-bg px-3 py-2 text-sm text-bad">{error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Sign in</Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
          <Button variant="outline" size="lg" className="w-full" disabled title="OIDC single sign-on is architecture-ready but no identity provider is configured">Continue with SSO (not configured)</Button>
          {process.env.NEXT_PUBLIC_SHOW_DEMO_HINT === "true" && <p className="mt-5 rounded-lg bg-info-bg p-3 text-xs text-info">Demo workspace: <b>tenant_admin@urbanstep.test</b> / <b>Settla!Demo123</b>. Simulated data only.</p>}
        </div>
      </section>
    </main>
  );
}
