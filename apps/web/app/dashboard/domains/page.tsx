import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const domains = await prisma.domain.findMany({ orderBy: { createdAt: "desc" } });

  const totalDomains = domains.length;
  const verifiedDomains = domains.filter((domain) => domain.status === "verified").length;
  const pendingDomains = domains.filter((domain) => domain.status === "pending").length;
  const attentionDomains = domains.filter((domain) => domain.status === "pending" || domain.status === "degraded").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Domains"
        description="Track verification state, provider coverage, and DNS health across managed domains."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={totalDomains} helper="Domains tracked in current workspace." />
        <StatCard label="Verified" value={verifiedDomains} helper="Ready for stable send and receive flows." />
        <StatCard label="Pending" value={pendingDomains} helper="Still waiting on DNS setup or recheck." />
        <StatCard label="Attention" value={attentionDomains} helper="Pending or degraded domains needing follow-up." />
      </div>

      <SectionCard
        title="Managed domains"
        description="DNS verification is not connected yet. Current view reflects stored domain status only."
        action={<StatusBadge status={attentionDomains > 0 ? "warning" : "verified"} label={attentionDomains > 0 ? "Attention" : "Verified"} />}
      >
        {domains.length === 0 ? (
          <EmptyState
            title="No domains yet"
            description="Add first managed domain to start tracking verification, identities, and routing health."
          />
        ) : (
          <div className="grid gap-4">
            {domains.map((domain) => (
              <div key={domain.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-50">{domain.domain}</h2>
                    <p className="mt-2 text-sm text-slate-400">Provider: {domain.provider}</p>
                  </div>
                  <StatusBadge status={domain.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
