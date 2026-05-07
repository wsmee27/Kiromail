import { verifyTwoFactorAction } from "@/app/actions/auth";

export default function TwoFactorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <form action={verifyTwoFactorAction} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">SwanMail</p>
          <h1 className="mt-3 text-2xl font-semibold">Two-factor check</h1>
          <p className="mt-2 text-sm text-slate-400">Enter the 6-digit code from your authenticator app.</p>
        </div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="token">Authentication code</label>
        <input className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-500 focus:ring-2" id="token" inputMode="numeric" maxLength={6} name="token" pattern="[0-9]{6}" required />
        <button className="mt-8 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">Verify</button>
      </form>
    </main>
  );
}
