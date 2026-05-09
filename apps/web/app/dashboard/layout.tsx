import { logoutAction } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/nav";
import { requireOwner } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))]" />
        <div className="absolute left-[18rem] top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>
      <aside className="fixed inset-y-0 left-0 w-72 p-5">
        <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-300">SwanMail</p>
            <h1 className="mt-4 text-xl font-semibold text-white">Owner dashboard</h1>
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Signed in as</p>
              <p className="mt-2 text-sm font-medium text-slate-100">Owner</p>
              <p className="mt-1 text-sm text-slate-400">{session.email}</p>
            </div>
          </div>

          <DashboardNav />

          <form action={logoutAction} className="mt-auto pt-6">
            <button className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white" type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="ml-72 min-h-screen px-6 py-8 md:px-8 lg:px-10">{children}</main>
    </div>
  );
}
