import { logoutAction } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/nav";
import { requireOwner } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-800 bg-slate-950/95 p-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">SwanMail</p>
          <p className="mt-2 text-sm text-slate-400">{session.email}</p>
        </div>
        <DashboardNav />
        <form action={logoutAction} className="absolute bottom-6 left-6 right-6">
          <button className="w-full rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" type="submit">Sign out</button>
        </form>
      </aside>
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
