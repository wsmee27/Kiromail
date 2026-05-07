import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const domains = await prisma.domain.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-3xl font-semibold">Domains</h1>
      <p className="mt-2 text-slate-400">DNS verification is not connected yet.</p>
      <div className="mt-8 grid gap-4">
        {domains.map((domain) => (
          <Card key={domain.id}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{domain.domain}</h2>
                <p className="text-sm text-slate-400">Provider: {domain.provider}</p>
              </div>
              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-sm text-amber-300">{domain.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
