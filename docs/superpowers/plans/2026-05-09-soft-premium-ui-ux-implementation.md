# Soft Premium UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh SwanMail MVP frontend into a simple, clear, soft-premium admin experience across current pages.

**Architecture:** Add small shared server-safe UI primitives for page headers, stats, status badges, empty states, and section cards. Rework existing App Router server pages around those primitives while preserving all current data fetching, server actions, routes, and product scope.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Tailwind CSS, Prisma, Vitest, Playwright browser smoke.

---

## File Structure

Create:

- `apps/web/components/ui/page-header.tsx` — reusable title/description/action header.
- `apps/web/components/ui/stat-card.tsx` — reusable metric card.
- `apps/web/components/ui/status-badge.tsx` — status/type/action badge color mapping.
- `apps/web/components/ui/empty-state.tsx` — reusable empty state panel.
- `apps/web/components/ui/section-card.tsx` — section wrapper with optional title, description, action, and body.
- `apps/web/tests/ui-components.test.ts` — shared UI primitive server-render tests.

Modify:

- `apps/web/components/ui/card.tsx` — softer base card surface.
- `apps/web/components/ui/button.tsx` — consistent focus/disabled states.
- `apps/web/components/ui/input.tsx` — consistent focus/placeholder states.
- `apps/web/components/dashboard/nav.tsx` — nav item spacing and active-state support.
- `apps/web/app/dashboard/layout.tsx` — soft premium shell, sidebar, user display, sign-out placement.
- `apps/web/app/login/page.tsx` — refined owner login card.
- `apps/web/app/login/2fa/page.tsx` — align 2FA auth card with login polish.
- `apps/web/app/dashboard/page.tsx` — stat grid, attention summary, quick links.
- `apps/web/app/dashboard/domains/page.tsx` — page header, summary cards, wizard clarity, status badges, responsive DNS table.
- `apps/web/app/dashboard/mailboxes/page.tsx` — identity list, send/receive/status chips, empty state, accessible form labels.
- `apps/web/app/dashboard/aliases/page.tsx` — alias list, type/status/tag chips, empty state, accessible form labels.
- `apps/web/app/dashboard/rules/page.tsx` — priority-ordered rule list, action badges, empty state, accessible form labels.
- `apps/web/app/dashboard/logs/page.tsx` — compact audit/email sections and empty states.
- `apps/web/app/dashboard/settings/page.tsx` — Security, Provider config, Backup/export, AI preferences section cards.

---

### Task 1: Add shared UI primitives

**Files:**
- Create: `apps/web/components/ui/page-header.tsx`
- Create: `apps/web/components/ui/stat-card.tsx`
- Create: `apps/web/components/ui/status-badge.tsx`
- Create: `apps/web/components/ui/empty-state.tsx`
- Create: `apps/web/components/ui/section-card.tsx`
- Modify: `apps/web/components/ui/card.tsx`
- Modify: `apps/web/components/ui/button.tsx`
- Modify: `apps/web/components/ui/input.tsx`
- Test: `apps/web/tests/ui-components.test.ts`

- [ ] **Step 1: Write failing shared component tests**

Create `apps/web/tests/ui-components.test.ts`:

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";

describe("soft premium UI primitives", () => {
  it("renders page header title, description, and action", () => {
    const html = renderToStaticMarkup(
      <PageHeader title="Domains" description="Manage DNS health." action={<a href="/dashboard/domains">Open</a>} />
    );

    expect(html).toContain("Domains");
    expect(html).toContain("Manage DNS health.");
    expect(html).toContain('href="/dashboard/domains"');
  });

  it("renders stat label, value, and helper", () => {
    const html = renderToStaticMarkup(<StatCard label="Domains" value={3} helper="1 needs attention" />);

    expect(html).toContain("Domains");
    expect(html).toContain(">3<");
    expect(html).toContain("1 needs attention");
  });

  it("renders status text without relying on color alone", () => {
    const html = renderToStaticMarkup(<StatusBadge status="verified" />);

    expect(html).toContain("verified");
  });

  it("renders empty state copy and action", () => {
    const html = renderToStaticMarkup(
      <EmptyState title="No aliases" description="Aliases protect public addresses." action={<a href="/dashboard/aliases">Create alias</a>} />
    );

    expect(html).toContain("No aliases");
    expect(html).toContain("Aliases protect public addresses.");
    expect(html).toContain('href="/dashboard/aliases"');
  });
});
```

- [ ] **Step 2: Run red test**

Run:

```powershell
pnpm --filter @swanmail/web test:run ui-components.test.ts
```

Expected: FAIL because shared UI primitive files do not exist.

- [ ] **Step 3: Add `PageHeader`**

Create `apps/web/components/ui/page-header.tsx`:

```tsx
export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">SwanMail Console</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Add `StatCard`**

Create `apps/web/components/ui/stat-card.tsx`:

```tsx
import { Card } from "@/components/ui/card";

export function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </Card>
  );
}
```

- [ ] **Step 5: Add `StatusBadge`**

Create `apps/web/components/ui/status-badge.tsx`:

```tsx
const statusClasses: Record<string, string> = {
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  verified: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  valid: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  enabled: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  degraded: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  pending: "border-slate-500/30 bg-slate-700/40 text-slate-300",
  neutral: "border-slate-500/30 bg-slate-700/40 text-slate-300",
  disabled: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  destructive: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  missing: "border-slate-500/30 bg-slate-700/40 text-slate-300",
  mismatch: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  manual: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  custom: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  service: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  disposable: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  catch_all_generated: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  forward: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  quarantine: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  drop: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  worker: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  label: "border-slate-500/30 bg-slate-700/40 text-slate-300"
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase();
  const className = statusClasses[normalized] ?? statusClasses.neutral;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label ?? status}
    </span>
  );
}
```

- [ ] **Step 6: Add `EmptyState`**

Create `apps/web/components/ui/empty-state.tsx`:

```tsx
export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/40 p-8 text-center">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 7: Add `SectionCard`**

Create `apps/web/components/ui/section-card.tsx`:

```tsx
import { Card } from "@/components/ui/card";

export function SectionCard({
  title,
  description,
  action,
  children,
  className = ""
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      {title || description || action ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold text-slate-50">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </Card>
  );
}
```

- [ ] **Step 8: Polish base `Card`, `Button`, and `Input`**

Replace `apps/web/components/ui/card.tsx` with:

```tsx
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur ${className}`}>
      {children}
    </div>
  );
}
```

Replace `apps/web/components/ui/button.tsx` with:

```tsx
export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

Replace `apps/web/components/ui/input.tsx` with:

```tsx
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 9: Run green test**

Run:

```powershell
pnpm --filter @swanmail/web test:run ui-components.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```powershell
git add apps/web/components/ui/page-header.tsx apps/web/components/ui/stat-card.tsx apps/web/components/ui/status-badge.tsx apps/web/components/ui/empty-state.tsx apps/web/components/ui/section-card.tsx apps/web/components/ui/card.tsx apps/web/components/ui/button.tsx apps/web/components/ui/input.tsx apps/web/tests/ui-components.test.ts
git commit -m "feat: add soft premium UI primitives"
```

---

### Task 2: Polish authentication and dashboard shell

**Files:**
- Modify: `apps/web/components/dashboard/nav.tsx`
- Modify: `apps/web/app/dashboard/layout.tsx`
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/login/2fa/page.tsx`

- [ ] **Step 1: Update dashboard nav active state**

Replace `apps/web/components/dashboard/nav.tsx` with:

```tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Dashboard", "/dashboard"],
  ["Domains", "/dashboard/domains"],
  ["Mailboxes", "/dashboard/mailboxes"],
  ["Aliases", "/dashboard/aliases"],
  ["Rules", "/dashboard/rules"],
  ["Logs", "/dashboard/logs"],
  ["Settings", "/dashboard/settings"]
] as const;

export function DashboardNav({ currentPath }: { currentPath?: string }) {
  return (
    <nav className="flex flex-col gap-1.5" aria-label="Dashboard navigation">
      {links.map(([label, href]) => {
        const isActive = currentPath ? (href === "/dashboard" ? currentPath === href : currentPath.startsWith(href)) : false;

        return (
          <Link
            key={href}
            href={href}
            className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: If Next.js rejects `usePathname` in server component, switch to client nav**

If `pnpm typecheck` later reports `usePathname` requires a client component, add this first line to `apps/web/components/dashboard/nav.tsx`:

```tsx
"use client";
```

Then remove `currentPath` prop and compute with `const currentPath = usePathname();` inside `DashboardNav`.

- [ ] **Step 3: Update dashboard layout**

Replace `apps/web/app/dashboard/layout.tsx` with:

```tsx
import { logoutAction } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/nav";
import { requireOwner } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800/80 bg-slate-950/85 p-6 shadow-2xl backdrop-blur lg:block">
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">SwanMail</p>
          <p className="mt-2 text-sm font-medium text-slate-100">FreakySwan Mail OS</p>
          <p className="mt-1 truncate text-xs text-slate-500">{session.email}</p>
        </div>
        <DashboardNav />
        <form action={logoutAction} className="absolute bottom-6 left-6 right-6">
          <button className="w-full rounded-2xl border border-slate-700/80 px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-200 focus:outline-none focus:ring-2 focus:ring-cyan-300" type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Update login page**

Replace `apps/web/app/login/page.tsx` with:

```tsx
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] px-6 text-slate-100">
      <form action={loginAction} className="w-full max-w-md rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.55)] backdrop-blur">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">SwanMail</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Owner login</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Private email control plane for FreakySwan Mail OS.</p>
        </div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="email">Email</label>
        <input className="mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none ring-cyan-400 transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2" id="email" name="email" type="email" required />
        <label className="mt-5 block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
        <input className="mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none ring-cyan-400 transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2" id="password" name="password" type="password" required />
        <button className="mt-8 w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950" type="submit">Sign in</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Update 2FA page**

Replace `apps/web/app/login/2fa/page.tsx` with same auth-shell styling, preserving `verifyTwoFactorAction`, `token` input name, numeric constraints, and `Verify` action text.

- [ ] **Step 6: Run typecheck**

Run:

```powershell
pnpm typecheck
```

Expected: PASS. If `DashboardNav` server/client boundary fails, apply Step 2 and rerun.

- [ ] **Step 7: Commit**

```powershell
git add apps/web/components/dashboard/nav.tsx apps/web/app/dashboard/layout.tsx apps/web/app/login/page.tsx apps/web/app/login/2fa/page.tsx
git commit -m "feat: polish auth and dashboard shell"
```

---

### Task 3: Refresh dashboard home and domains page

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`
- Modify: `apps/web/app/dashboard/domains/page.tsx`

- [ ] **Step 1: Update dashboard home**

Replace `apps/web/app/dashboard/page.tsx` with a server component that:

- imports `Link`, `PageHeader`, `SectionCard`, `StatCard`, `StatusBadge`, and `prisma`.
- fetches domain/mailbox/alias/event/audit counts.
- fetches `attentionDomains = prisma.domain.count({ where: { status: { in: ["pending", "degraded"] } } })`.
- renders `PageHeader` with title `Dashboard` and description `At-a-glance health for domains, identities, aliases, routing, and logs.`
- renders `StatCard` grid for Domains, Mailboxes, Aliases, Email events, Audit logs.
- renders `SectionCard` titled `Attention needed` with `StatusBadge` showing `verified` when `attentionDomains === 0`, otherwise `warning`.
- renders quick links to `/dashboard/domains`, `/dashboard/mailboxes`, `/dashboard/aliases`.

- [ ] **Step 2: Update domains page imports and counts**

Modify `apps/web/app/dashboard/domains/page.tsx` to import shared UI primitives:

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
```

Compute counts:

```tsx
const verifiedCount = domains.filter((domain) => domain.status === "verified").length;
const pendingCount = domains.filter((domain) => domain.status === "pending").length;
const degradedCount = domains.filter((domain) => domain.status === "degraded").length;
```

- [ ] **Step 3: Replace domains header and stats**

At top of domains JSX, render:

```tsx
<PageHeader title="Domains" description="Add domains, check DNS health, and apply safe Cloudflare email DNS fixes." />
<div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <StatCard label="Total domains" value={domains.length} helper="Managed identities root" />
  <StatCard label="Verified" value={verifiedCount} helper="Ready for routing" />
  <StatCard label="Pending" value={pendingCount} helper="Waiting on DNS" />
  <StatCard label="Attention" value={degradedCount} helper="DNS mismatch found" />
</div>
```

- [ ] **Step 4: Rework domain wizard section**

Wrap existing add-domain form and selected-domain DNS table in `SectionCard` titled `Domain setup wizard`. Keep server actions unchanged: `createDomainAction`, `checkDomainDnsAction`, `applyDomainDnsFixesAction`.

Requirements:

- Cloudflare state shown with `StatusBadge status={cloudflare.configured ? "verified" : "manual"}` and text `Cloudflare configured` or `Cloudflare not configured`.
- Domain input keeps `id="domain"`, `name="domain"`, visible or `sr-only` label.
- Add-domain submit text remains `Add domain`.
- DNS table wrapper uses `overflow-x-auto` to avoid narrow overflow.
- Each DNS status uses `StatusBadge status={record.status}`.
- If no selected domain, show `EmptyState` titled `No domains yet` with description `Add a domain to see required MX, SPF, DMARC, and manual DKIM guidance.`

- [ ] **Step 5: Rework domain list cards**

Use `SectionCard` titled `Managed domains`. For each domain card:

- show domain, provider, `StatusBadge status={domain.status}`.
- keep per-domain `Check DNS` form action and hidden `id`.
- keep per-domain `Apply fixes` form action and hidden `id`.
- disable `Apply fixes` when Cloudflare is not configured.
- avoid adding any new domain actions.

If `domains.length === 0`, show the same `EmptyState` instead of empty list.

- [ ] **Step 6: Run typecheck**

Run:

```powershell
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add apps/web/app/dashboard/page.tsx apps/web/app/dashboard/domains/page.tsx
git commit -m "feat: refresh dashboard and domains UI"
```

---

### Task 4: Refresh mailboxes, aliases, and rules pages

**Files:**
- Modify: `apps/web/app/dashboard/mailboxes/page.tsx`
- Modify: `apps/web/app/dashboard/aliases/page.tsx`
- Modify: `apps/web/app/dashboard/rules/page.tsx`

- [ ] **Step 1: Update mailboxes page**

Modify `apps/web/app/dashboard/mailboxes/page.tsx` to:

- use `PageHeader` title `Mailboxes` and description `Manage mailbox identities and destination inbox routing.`
- add summary cards: total mailboxes, send enabled, receive enabled.
- wrap create form in `SectionCard` titled `Create mailbox`.
- add visible labels for domain, local part, destination inbox, send enabled.
- keep `createMailboxAction` and `disableMailboxAction` unchanged.
- list each mailbox with address, destination, `StatusBadge status={mailbox.status}`, `StatusBadge status={mailbox.sendEnabled ? "enabled" : "disabled"} label={mailbox.sendEnabled ? "send on" : "send off"}`, and receive chip if model field exists.
- show `EmptyState` titled `No mailboxes yet` with description `Mailboxes are named identities that route mail to destination inboxes.` when empty.

- [ ] **Step 2: Update aliases page**

Modify `apps/web/app/dashboard/aliases/page.tsx` to:

- use `PageHeader` title `Aliases` and description `Create safer public-facing addresses and route them to mailbox identities.`
- add summary cards: total aliases, service aliases, catch-all generated aliases.
- wrap create form in `SectionCard` titled `Create alias`.
- add visible labels for domain, local part, destination mailbox, alias type, tags.
- keep `createAliasAction` and `disableAliasAction` unchanged.
- list each alias with address, destination mailbox or `No destination`, `StatusBadge status={alias.status}`, `StatusBadge status={alias.type}`.
- render tags as small slate chips when present.
- show `EmptyState` titled `No aliases yet` with description `Aliases protect private inboxes by giving services and public signups separate addresses.` when empty.

- [ ] **Step 3: Update rules page**

Modify `apps/web/app/dashboard/rules/page.tsx` to:

- use `PageHeader` title `Routing rules` and description `Review priority-ordered routing behavior for domains and aliases.`
- add summary cards: total rules, enabled rules, disabled rules.
- wrap create form in `SectionCard` titled `Create rule`.
- add visible labels for domain, alias scope, action, condition JSON, destination JSON, priority, enabled.
- keep `createRoutingRuleAction` and `disableRoutingRuleAction` unchanged.
- list rules in priority order with `StatusBadge status={rule.action}`, priority, scope, enabled/disabled badge.
- show `EmptyState` titled `No routing rules yet` with description `Start with a catch-all quarantine rule as the safe default for unknown recipients.` when empty.

- [ ] **Step 4: Run typecheck**

Run:

```powershell
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/app/dashboard/mailboxes/page.tsx apps/web/app/dashboard/aliases/page.tsx apps/web/app/dashboard/rules/page.tsx
git commit -m "feat: refresh identity and routing pages"
```

---

### Task 5: Refresh logs and settings pages

**Files:**
- Modify: `apps/web/app/dashboard/logs/page.tsx`
- Modify: `apps/web/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Update logs page**

Modify `apps/web/app/dashboard/logs/page.tsx` to:

- use `PageHeader` title `Logs` and description `Review owner-visible audit activity and provider email events.`
- add summary cards: audit logs, email events.
- keep audit logs and email events as separate `SectionCard` sections.
- keep current data fetching and limits.
- render compact rows with action/event type, resource/provider, and ISO timestamp.
- show `EmptyState` titled `No audit logs yet` if audit logs empty.
- show `EmptyState` titled `No email events yet` if email events empty.
- do not add filters.

- [ ] **Step 2: Update settings page**

Modify `apps/web/app/dashboard/settings/page.tsx` to:

- use `PageHeader` title `Settings` and description `Review security, provider, backup, and AI posture for the MVP.`
- render four `SectionCard` sections:
  - `Security` with copy `Owner login and 2FA are part of the MVP security baseline.`
  - `Provider config` with copy `Cloudflare, Mailtrap, and DNS providers stay behind provider adapters.`
  - `Backup/export` with copy `Configuration backup and export are planned MVP safeguards.`
  - `AI preferences` with copy `Email body access remains opt-in; metadata-only access is the default.`
- do not add fake toggles, inputs, or unimplemented controls.

- [ ] **Step 3: Run typecheck**

Run:

```powershell
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/app/dashboard/logs/page.tsx apps/web/app/dashboard/settings/page.tsx
git commit -m "feat: refresh logs and settings UI"
```

---

### Task 6: Final verification and browser smoke

**Files:**
- Verify only; modify files only if verification exposes defects.

- [ ] **Step 1: Run automated verification**

Run from repository root:

```powershell
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 2: Start dev server**

Run:

```powershell
pnpm dev
```

Expected: Next.js dev server starts and prints local URL.

- [ ] **Step 3: Browser smoke login**

Using Playwright MCP or browser:

1. Open `/login`.
2. Confirm refined SwanMail login card renders.
3. Log in with local seeded owner credentials.
4. Confirm redirect to `/dashboard`.

Expected: login behavior unchanged.

- [ ] **Step 4: Browser smoke dashboard pages**

Visit:

- `/dashboard`
- `/dashboard/domains`
- `/dashboard/mailboxes`
- `/dashboard/aliases`
- `/dashboard/rules`
- `/dashboard/logs`
- `/dashboard/settings`

Expected:

- each page loads.
- page header appears.
- no obvious horizontal overflow at desktop width.
- no obvious horizontal overflow at narrow viewport.
- sidebar remains usable on desktop.

- [ ] **Step 5: Browser smoke domain wizard**

On `/dashboard/domains`:

1. Confirm Domain setup wizard remains visible.
2. Confirm add-domain input has accessible label association (`id="domain"`, `name="domain"`).
3. Add a test domain if local DB state allows it.
4. Confirm `Check DNS` and `Apply fixes` buttons still render per domain.

Expected: domain server actions and UI remain present.

- [ ] **Step 6: Commit any verification fixes**

If verification required code fixes:

```powershell
git add <fixed-files>
git commit -m "fix: resolve soft premium UI verification issues"
```

Expected: no commit if no fixes were needed.

---

## Self-Review Checklist

- Spec coverage:
  - Login page covered by Task 2.
  - Dashboard shell/navigation covered by Task 2.
  - Dashboard home covered by Task 3.
  - Domains page covered by Task 3.
  - Mailboxes, Aliases, Rules covered by Task 4.
  - Logs and Settings covered by Task 5.
  - Shared UI patterns covered by Task 1.
  - Accessibility and narrow-layout checks covered across Tasks 1–6.
- Placeholder scan: no TBD/TODO/fill-in-later instructions remain.
- Scope check: no new product capability, data model change, UI library, theme switcher, or provider integration added.
- Type consistency: component names match planned imports: `PageHeader`, `StatCard`, `StatusBadge`, `EmptyState`, `SectionCard`.
