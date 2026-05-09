import { verifyTwoFactorAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TwoFactorPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.16),_transparent_22%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))]" />
      <div className="absolute left-1/2 top-20 -z-10 h-64 w-64 -translate-x-[125%] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-12 right-1/2 -z-10 h-72 w-72 translate-x-[120%] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <Card className="w-full max-w-md border-white/10 bg-white/6 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
        <form action={verifyTwoFactorAction}>
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">SwanMail</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Two-factor check</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Enter 6-digit verification code from authenticator app to continue into owner dashboard.</p>
          </div>

          <label className="block text-sm font-medium text-slate-300" htmlFor="token">Authentication code</label>
          <Input
            className="mt-2 h-14 border-white/10 bg-slate-950/60 px-4 text-center text-2xl tracking-[0.5em]"
            id="token"
            inputMode="numeric"
            maxLength={6}
            name="token"
            pattern="[0-9]{6}"
            required
          />

          <Button className="mt-8 h-12 w-full rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200" type="submit">Verify</Button>
        </form>
      </Card>
    </main>
  );
}
