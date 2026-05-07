import { createAliasAction, disableAliasAction } from "@/app/actions/aliases";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AliasesPage() {
  const [domains, mailboxes, aliases] = await Promise.all([
    prisma.domain.findMany(),
    prisma.mailbox.findMany({ orderBy: { address: "asc" } }),
    prisma.alias.findMany({ include: { destinationMailbox: true }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Aliases</h1>
      <p className="mt-2 text-slate-400">Provider sync is not connected yet.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold">Create alias</h2>
          <form action={createAliasAction} className="mt-4 space-y-3">
            <select name="domainId" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.domain}</option>)}
            </select>
            <Input name="localPart" placeholder="github" required />
            <select name="destinationMailboxId" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="">No destination</option>
              {mailboxes.map((mailbox) => <option key={mailbox.id} value={mailbox.id}>{mailbox.address}</option>)}
            </select>
            <select name="type" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="custom">custom</option>
              <option value="service">service</option>
              <option value="disposable">disposable</option>
              <option value="catch_all_generated">catch_all_generated</option>
            </select>
            <Input name="tags" placeholder="service, security" />
            <button className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950" type="submit">Create</button>
          </form>
        </Card>
        <div className="space-y-3">
          {aliases.map((alias) => (
            <Card key={alias.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{alias.address}</p>
                  <p className="text-sm text-slate-400">{alias.type} · {alias.status} · {alias.tags.join(", ") || "no tags"}</p>
                </div>
                <form action={disableAliasAction}>
                  <input name="id" type="hidden" value={alias.id} />
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
