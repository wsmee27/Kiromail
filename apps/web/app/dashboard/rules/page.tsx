import { createRoutingRuleAction, disableRoutingRuleAction } from "@/app/actions/routing-rules";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const [domains, aliases, rules] = await Promise.all([
    prisma.domain.findMany(),
    prisma.alias.findMany({ orderBy: { address: "asc" } }),
    prisma.routingRule.findMany({ include: { alias: true, domain: true }, orderBy: { priority: "asc" } })
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Routing rules</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold">Create rule</h2>
          <form action={createRoutingRuleAction} className="mt-4 space-y-3">
            <select name="domainId" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.domain}</option>)}
            </select>
            <select name="aliasId" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="">Domain-level rule</option>
              {aliases.map((alias) => <option key={alias.id} value={alias.id}>{alias.address}</option>)}
            </select>
            <select name="action" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="forward">forward</option>
              <option value="quarantine">quarantine</option>
              <option value="drop">drop</option>
              <option value="worker">worker</option>
              <option value="label">label</option>
            </select>
            <Input name="conditionJson" defaultValue='{"recipient":"*"}' />
            <Input name="destinationJson" defaultValue='{"type":"inbox"}' />
            <Input name="priority" defaultValue="100" type="number" />
            <label className="flex gap-2 text-sm text-slate-300"><input name="enabled" type="checkbox" defaultChecked /> Enabled</label>
            <button className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950" type="submit">Create</button>
          </form>
        </Card>
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{rule.action} · priority {rule.priority}</p>
                  <p className="text-sm text-slate-400">{rule.alias?.address ?? rule.domain.domain} · {rule.enabled ? "enabled" : "disabled"}</p>
                </div>
                <form action={disableRoutingRuleAction}>
                  <input name="id" type="hidden" value={rule.id} />
                  <button className="rounded-lg border border-slate-700 px-3 py-1 text-sm" type="submit">Disable</button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
