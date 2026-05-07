import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <form action={loginAction} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">SwanMail</p>
          <h1 className="mt-3 text-2xl font-semibold">Owner login</h1>
          <p className="mt-2 text-sm text-slate-400">Access FreakySwan Mail OS dashboard.</p>
        </div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="email">Email</label>
        <input className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-500 focus:ring-2" id="email" name="email" type="email" required />
        <label className="mt-5 block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
        <input className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-500 focus:ring-2" id="password" name="password" type="password" required />
        <button className="mt-8 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">Sign in</button>
      </form>
    </main>
  );
}
