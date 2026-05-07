import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [domains, mailboxes, aliases, events, auditLogs] = await Promise.all([
    prisma.domain.count(),
    prisma.mailbox.count(),
    prisma.alias.count(),
    prisma.emailEvent.count(),
    prisma.auditLog.count()
  ]);

  const stats = [
    ["Domains", domains],
    ["Mailboxes", mailboxes],
    ["Aliases", aliases],
    ["Email events", events],
    ["Audit logs", auditLogs]
  ] as const;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-slate-400">Hybrid email control plane foundation.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
