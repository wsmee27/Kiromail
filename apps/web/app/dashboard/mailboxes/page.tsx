import { createMailboxAction, disableMailboxAction } from "@/app/actions/mailboxes";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MailboxesPage() {
  const [domains, mailboxes] = await Promise.all([
    prisma.domain.findMany(),
    prisma.mailbox.findMany({ include: { domain: true }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Mailboxes</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold">Create mailbox</h2>
          <form action={createMailboxAction} className="mt-4 space-y-3">
            <select name="domainId" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.domain}</option>)}
            </select>
            <Input name="localPart" placeholder="founder" required />
            <Input name="inboxDestination" placeholder="owner@gmail.com" type="email" />
            <label className="flex gap-2 text-sm text-slate-300"><input name="sendEnabled" type="checkbox" /> Send enabled</label>
            <button className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950" type="submit">Create</button>
          </form>
        </Card>
        <div className="space-y-3">
          {mailboxes.map((mailbox) => (
            <Card key={mailbox.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{mailbox.address}</p>
                  <p className="text-sm text-slate-400">Destination: {mailbox.inboxDestination ?? "Not set"}</p>
                </div>
                <form action={disableMailboxAction}>
                  <input name="id" type="hidden" value={mailbox.id} />
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
