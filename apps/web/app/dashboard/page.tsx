import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [domains, mailboxes, aliases, events, auditLogs, attentionDomains] = await Promise.all([
    prisma.domain.count(),
    prisma.mailbox.count(),
    prisma.alias.count(),
    prisma.emailEvent.count(),
    prisma.auditLog.count(),
    prisma.domain.findMany({
      where: { status: { in: ["pending", "degraded"] } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 5
    })
  ]);

  const stats = [
    { label: "Domains", value: domains, helper: "Managed sending and routing surfaces." },
    { label: "Mailboxes", value: mailboxes, helper: "Inbox identities across active domains." },
    { label: "Aliases", value: aliases, helper: "Forwarding and disposable entry points." },
    { label: "Email events", value: events, helper: "Recent delivery and webhook records." },
    { label: "Audit logs", value: auditLogs, helper: "Owner-visible security and config trail." }
  ] as const;

  const hasAttention = attentionDomains.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="At-a-glance health for domains, identities, aliases, routing, and logs."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
        ))}
      </div>

      <SectionCard
        title="Attention needed"
        description={
          hasAttention
            ? "Pending or degraded domains still need DNS review before mail flow is fully healthy."
            : "All tracked domains currently look healthy from stored status."
        }
        action={<StatusBadge status={hasAttention ? "warning" : "verified"} label={hasAttention ? "Warning" : "Verified"} />}
      >
        {hasAttention ? (
          <div className="space-y-3">
            {attentionDomains.map((domain) => (
              <div
                key={domain.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{domain.domain}</p>
                  <p className="mt-1 text-sm text-slate-400">Provider: {domain.provider}</p>
                </div>
                <StatusBadge status={domain.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-400">No pending or degraded domains in current dataset.</p>
        )}
      </SectionCard>

      <SectionCard title="Quick links" description="Jump into setup and daily admin flows.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              href: "/dashboard/domains",
              title: "Domains",
              description: "Review verification status and provider setup."
            },
            {
              href: "/dashboard/mailboxes",
              title: "Mailboxes",
              description: "Manage identities and inbox destinations."
            },
            {
              href: "/dashboard/aliases",
              title: "Aliases",
              description: "Control routing endpoints and disposable coverage."
            }
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition hover:border-cyan-400/30 hover:bg-slate-950"
            >
              <p className="text-sm font-semibold text-slate-100">{link.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{link.description}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
