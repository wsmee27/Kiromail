# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository contains a Next.js App Router foundation in `apps/web`, local PostgreSQL infrastructure in `infra/docker-compose.yml`, and product requirements in the PRD.

## Source of truth

- `PRD_Email_Pribadi_FreakySwan_v2.md` is the current product specification for FreakySwan Mail OS / SwanMail.
- The PRD is in Indonesian and targets an MVP for a personal and small-team email platform on `freakyswan.my.id`.

## Current commands

Run commands from the repository root.

- Install dependencies: `pnpm install`
- Start local DB: `docker compose -f infra/docker-compose.yml up -d`
- Run migrations: `pnpm db:migrate`
- Seed database: `pnpm db:seed`
- Start dev server: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Run tests: `pnpm test:run`
- Run one test: `pnpm --filter @swanmail/web test:run <pattern>`
- Build: `pnpm build`

Local DB commands require Docker Desktop or another Docker daemon running.

## Product direction

Build the MVP as a hybrid email platform, not a full self-hosted primary mail server.

Recommended MVP architecture from the PRD:

- Cloudflare DNS + Email Routing/Workers for inbound routing.
- Gmail as daily inbox/client.
- Mailtrap SMTP/API for outbound transactional, personal send-as, and future bulk/newsletter.
- Custom dashboard on VPS for mailbox identities, aliases, routing rules, logs, audit, backup, DNS health, and optional AI.
- Stalwart or other self-hosted mail stack only as Phase 2/lab after deliverability, monitoring, backup, and abuse controls are mature.

## Planned stack

Use TypeScript end-to-end unless user changes direction.

Recommended stack from PRD:

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod.
- Backend: Next.js API Routes/Server Actions for MVP; NestJS/Fastify only if backend becomes separate.
- Database: PostgreSQL with Prisma or Drizzle.
- Queue/cache/rate limit: Redis, likely BullMQ for jobs.
- Infrastructure: Docker Compose on VPS, Nginx or Caddy reverse proxy, S3-compatible backups.
- Observability: structured/OpenTelemetry-compatible logs, optional Grafana/Prometheus, Sentry, healthcheck endpoint.

## Big-picture architecture

Keep provider-specific code behind adapters. Business logic must not hardcode Cloudflare or Mailtrap directly.

Core provider boundaries from PRD:

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
```

Expected future monorepo shape from PRD:

```txt
apps/
  web/
packages/
  db/
  email-providers/
  dns/
  ai/
  config/
infra/
  docker-compose.yml
  nginx/
docs/
  dns-setup.md
  gmail-send-as.md
  security.md
```

## Domain model

Primary entities planned in PRD:

- `users`: owner/admin/member accounts and invite status.
- `domains`: managed domains and verification status.
- `mailboxes`: domain identities with destination inbox and send/receive flags.
- `aliases`: custom/service/disposable/catch-all-generated aliases.
- `routing_rules`: forward, quarantine, drop, worker, label actions.
- `email_events`: inbound/outbound/webhook metadata, not full email body by default.
- `audit_logs`: owner-visible security and configuration history.
- `ai_preferences`: per-user/per-mailbox AI permissions.

## MVP scope priorities

Must-have MVP capabilities:

1. Owner login.
2. Domain setup wizard and DNS health checker.
3. Mailbox identity management.
4. Alias management.
5. Forwarding destination management.
6. Catch-all quarantine.
7. SMTP/send-as setup guide.
8. Mailtrap outbound integration.
9. Delivery/webhook event log.
10. Owner audit log.
11. Backup/export config.
12. Basic opt-in AI daily digest.

## Email and deliverability rules

- Keep personal/team email on `freakyswan.my.id`.
- Use separate subdomains for riskier send streams:
  - `notify.freakyswan.my.id` for transactional app email.
  - `updates.freakyswan.my.id` for newsletter/marketing.
  - `labs.freakyswan.my.id` for experiments.
- DMARC rollout should start at `p=none`, then move to `p=quarantine`, then `p=reject` only after all senders align.
- Catch-all should default to quarantine, not direct inbox forwarding.
- Newsletter/bulk email must not share primary personal email reputation.

## Security and privacy constraints

- AI body access is opt-in only; metadata-only access is the default.
- Exclude sensitive mailboxes/aliases from AI by default, especially `admin@`, `security@`, `billing@`, `cloudflare@`, `github@`, and `bank@` on `freakyswan.my.id`.
- Store email metadata for MVP, not full email body unless user explicitly decides otherwise.
- Owner account must support 2FA.
- API keys and SMTP credentials must be encrypted at rest and support rotation.
- SMTP passwords must not be shown again after creation.
- Audit log must cover login events, failed login, alias changes, routing changes, API key changes, backup export, and AI access changes.

## Implementation caution

When scaffolding starts, first confirm package manager and framework choices if no project files exist yet. Then create real commands in this file after they are present in the repository.
