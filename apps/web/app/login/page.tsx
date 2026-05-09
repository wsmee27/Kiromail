import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))]" />
      <div className="absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-[130%] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-10 right-1/2 -z-10 h-80 w-80 translate-x-[120%] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="w-full max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.38em] text-cyan-300">SwanMail</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Private mail control with calm, premium ops.</h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Manage domains, aliases, routing, and audit visibility from one secure owner dashboard built for FreakySwan Mail OS.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Domain health</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Alias control</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Audit-ready access</span>
            </div>
          </section>

          <Card className="border-white/10 bg-white/6 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
            <form action={loginAction} className="w-full">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">Owner access</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Sign in</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Use owner credentials to access dashboard, domain setup, and delivery controls.</p>
              </div>

              <label className="block text-sm font-medium text-slate-300" htmlFor="email">Email</label>
              <Input className="mt-2 h-12 border-white/10 bg-slate-950/60 px-4" id="email" name="email" type="email" required />

              <label className="mt-5 block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
              <Input className="mt-2 h-12 border-white/10 bg-slate-950/60 px-4" id="password" name="password" type="password" required />

              <Button className="mt-8 h-12 w-full rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200" type="submit">Sign in</Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
