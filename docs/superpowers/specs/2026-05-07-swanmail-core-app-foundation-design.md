# SwanMail Core App Foundation Design

## Context

The repository currently contains PRD and guidance only. There is no application code, package manager config, git repository, or existing build/test command. The first implementation slice should create a runnable foundation for SwanMail without attempting the full email platform at once.

The PRD recommends a hybrid MVP: Cloudflare for DNS/inbound routing, Gmail as daily inbox, Mailtrap for outbound, and a custom VPS-hosted dashboard for identities, aliases, routing, logs, audit, backup, and optional AI.

## Goal

Build the SwanMail Core App Foundation: a minimal but production-shaped app foundation for owner-managed domain email configuration.

This slice should create:

- Next.js App Router application with TypeScript and Tailwind.
- PostgreSQL persistence through Prisma.
- Docker Compose infrastructure for local PostgreSQL.
- Owner-only authentication foundation.
- Core schema and seed data for `freakyswan.my.id`.
- Dashboard shell and CRUD foundation for core email identity records.
- Provider boundaries that keep Cloudflare/Mailtrap details out of business logic.

## Non-goals

This slice must not implement:

- Real Cloudflare API integration.
- Real Mailtrap API/SMTP integration.
- Real DNS verification.
- Real inbound/outbound email sending.
- AI digest/classification.
- Team invitations.
- Newsletter/campaign workflows.
- Full SaaS multi-tenancy.

## Recommended approach

Use an MVP monorepo-light structure:

```txt
apps/
  web/
    app/
    components/
    lib/
    prisma/
packages/
  config/
infra/
  docker-compose.yml
```

This is lighter than a full Turborepo setup but leaves clear room for future packages. `apps/web` owns the first app, auth, API/server actions, Prisma client, and UI. `packages/config` is only for shared constants if needed.

## Application architecture

### Web app

`apps/web` should use:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Server components by default.
- Client components only for forms, tables, and interactions that require browser state.

Initial routes:

- `/login`
- `/dashboard`
- `/dashboard/domains`
- `/dashboard/mailboxes`
- `/dashboard/aliases`
- `/dashboard/rules`
- `/dashboard/logs`
- `/dashboard/settings`

Dashboard pages should focus on foundation and records. Provider-dependent operations should clearly show “not connected yet” instead of pretending to work.

### Provider boundaries

Create TypeScript interfaces for provider-dependent operations:

```ts
interface EmailRoutingProvider {
  createAlias(input: CreateAliasInput): Promise<AliasResult>
  disableAlias(aliasId: string): Promise<void>
  listAliases(): Promise<AliasResult[]>
  verifyDomain(domain: string): Promise<DomainVerificationResult>
}

interface EmailSendingProvider {
  sendEmail(input: SendEmailInput): Promise<SendResult>
  verifySendingDomain(domain: string): Promise<DomainVerificationResult>
  listEvents(input: EventQuery): Promise<EmailEvent[]>
}

interface DnsProvider {
  getRecords(domain: string): Promise<DnsRecord[]>
  verifyEmailRecords(domain: string): Promise<DomainVerificationResult>
}
```

For this slice, use mock/stub implementations only. Real Cloudflare and Mailtrap adapters are future slices.

## Data model

Prisma schema should include first-version core entities:

- `User`: owner/admin/member role support, though first slice only uses owner.
- `Domain`: domain name, provider, status, primary flag.
- `Mailbox`: domain identity, owner, destination inbox, send/receive flags, status.
- `Alias`: custom/service/disposable/catch-all-generated alias, destination mailbox, status, expiry, notes, tags.
- `RoutingRule`: alias/domain rule with JSON condition/action payloads, priority, enabled flag.
- `EmailEvent`: provider/webhook/log metadata only. No full email body.
- `AuditLog`: actor, action, resource, IP/user-agent, metadata.
- `AiPreference`: metadata/body access and digest flags.

Seed data should create:

- Domain: `freakyswan.my.id`.
- Default mailboxes from PRD: `founder@`, `hello@`, `team@`, `support@`, `admin@`, `billing@`, `security@`.
- Default alias tags from PRD.
- Sensitive address defaults represented through tags/settings where practical.
- Owner user from environment variables.

Required seed env vars:

```txt
SEED_OWNER_EMAIL=
SEED_OWNER_PASSWORD=
```

## Authentication

First slice uses owner-only auth:

- No public signup.
- Login with seeded owner email/password.
- Password hash stored in DB.
- Session cookie guards `/dashboard/**`.
- Auth design must not block 2FA in later slice.

2FA is required by PRD for owner account but is not part of this first slice.

## Core flows

Implement these flows:

1. Owner logs in.
2. Owner lands on dashboard summary.
3. Owner views domain, mailbox, alias, routing rule, and log pages.
4. Owner creates/edits/disables mailbox records.
5. Owner creates/edits/disables alias records.
6. Owner creates/edits/disables routing rules.
7. Mutations write audit log records.
8. Seed script initializes default domain identities.

## Validation and errors

Use Zod at input boundaries.

Handle at least:

- Duplicate domain/address values.
- Invalid email local-part.
- Invalid enum/status values.
- Missing owner seed env vars.
- Unauthorized dashboard access.

Provider-backed actions must not report success while provider adapters are mock-only. UI should label those capabilities as not connected.

## Testing and verification

First slice should include tests or checks for:

- Prisma schema validity/migration.
- Seed script behavior.
- Auth guard for dashboard routes.
- Zod validation for core forms/actions.
- Audit log creation on mutations.

Minimal smoke path:

1. Start PostgreSQL with Docker Compose.
2. Run migrations.
3. Run seed.
4. Start web app.
5. Log in as owner.
6. Create alias.
7. Confirm audit log entry exists.

## Commands to document after implementation

After code exists, update `CLAUDE.md` with real commands for:

- Install dependencies.
- Start local DB.
- Run migrations.
- Seed database.
- Start dev server.
- Lint.
- Typecheck.
- Run tests.
- Run one test.

Do not document commands before they exist in project config.

## Risks

- Full PRD is much larger than this slice. Keep this foundation focused.
- Real email provider APIs can add complexity; stubs protect app architecture until provider slices begin.
- Auth shortcuts can become hard to replace; keep session/auth boundaries explicit.
- Storing email body would raise privacy scope; this slice stores metadata only.

## Approval criteria

This design is ready when it enables a runnable local dashboard foundation with seeded domain data, owner login, core record management, audit logs, and provider abstraction stubs, without real email delivery or DNS automation.
