import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const [auditLogs, emailEvents] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.emailEvent.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Logs</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Audit logs</h2>
          <div className="mt-4 space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b border-slate-800 pb-3 text-sm">
                <p className="font-medium">{log.action}</p>
                <p className="text-slate-400">{log.resourceType ?? "system"} · {log.createdAt.toISOString()}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Email events</h2>
          <div className="mt-4 space-y-3">
            {emailEvents.map((event) => (
              <div key={event.id} className="border-b border-slate-800 pb-3 text-sm">
                <p className="font-medium">{event.eventType}</p>
                <p className="text-slate-400">{event.provider} · {event.createdAt.toISOString()}</p>
              </div>
            ))}
            {emailEvents.length === 0 ? <p className="text-sm text-slate-400">No provider events yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
