# Domain setup wizard and DNS health checker design

## Goal

Add a Cloudflare-connected domain setup wizard to SwanMail so owner can add a domain, inspect required email DNS records, check live Cloudflare DNS state, and apply safe DNS fixes from the dashboard.

## Scope

In scope:

- Domain setup UI on `/dashboard/domains`.
- Env-only Cloudflare configuration using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`.
- Cloudflare DNS adapter behind the existing `DnsProvider` boundary.
- Expected email DNS record generation for MVP.
- Live DNS comparison against Cloudflare records.
- Safe apply flow for missing or app-managed records.
- Audit logs for domain creation, DNS check, apply, and failures.
- Tests for record generation, comparison, adapter mapping, and core server action behavior.

Out of scope:

- Credential UI or encrypted provider credential storage.
- Multi-provider DNS management.
- Mailtrap DKIM automation before Mailtrap adapter exists.
- Full multi-step route per domain.
- Blind overwrites of existing conflicting DNS records.

## Architecture

Add `CloudflareDnsProvider` implementing the existing `DnsProvider` interface. It reads Cloudflare config from environment variables, calls Cloudflare DNS APIs, and maps provider records into app-level `DnsRecord` objects.

Add domain DNS service functions:

- `getExpectedEmailDnsRecords(domain: string)` returns required MVP records.
- `compareDnsRecords(expected, actual)` returns per-record status: `valid`, `missing`, `mismatch`, or `manual`.
- `getDomainDnsHealth(domain)` combines expected records, provider records, and aggregate domain status.
- `applyDomainDnsFixes(domain)` creates missing records and safe updates only.

Keep business logic provider-agnostic. Server actions call service functions, not Cloudflare directly.

## Expected DNS records

MVP records:

- MX records for Cloudflare Email Routing.
- SPF TXT record for current allowed senders.
- DMARC TXT record starting at `p=none`.
- DKIM rows marked `manual` until Mailtrap integration provides concrete selectors and values.

Record generation must be deterministic and testable. Newsletter/bulk sender records remain out of scope for this feature.

## Data model

Keep existing `Domain` fields and add one optional snapshot field:

```prisma
verificationRecords Json @default("[]")
```

This stores the last DNS check result for display without requiring a Cloudflare call on every page render.

Domain status mapping:

- `verified`: all required non-manual records valid.
- `degraded`: at least one required record mismatch.
- `pending`: records missing or not checked.
- `disabled`: unchanged existing domain state.

## UI design

`/dashboard/domains` becomes a two-column page.

Left column: setup wizard card.

1. Domain input and create action.
2. Cloudflare connection status from env/API reachability.
3. Required DNS records table.
4. Buttons: `Check DNS` and `Apply fixes`.

Right column: managed domains list with status badges and last check snapshot.

DNS table columns:

- Type
- Name
- Expected value
- Current value
- Status
- Notes

No separate route is needed yet. A future `/dashboard/domains/[id]/setup` route can be added when domain detail pages grow.

## Server actions

Add or extend domain actions:

- `createDomainAction(formData)` validates domain, creates or updates provider=`cloudflare`, audits `domain.create`, and redirects/revalidates.
- `checkDomainDnsAction(formData)` checks Cloudflare DNS, stores `verificationRecords`, updates `Domain.status`, audits `domain.dns_check`, and revalidates domains page.
- `applyDomainDnsFixesAction(formData)` applies missing/safe records, re-checks DNS, stores latest snapshot, audits `domain.dns_apply`, and revalidates.

## Error handling

- Missing `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ZONE_ID`: show “Cloudflare not configured”, disable apply, allow manual checklist display.
- Cloudflare API error/rate limit: preserve existing domain status, audit `domain.dns_check_failed` or `domain.dns_apply_failed`, and show safe error state.
- Existing conflicting DNS records: mark `mismatch`; do not overwrite unless exact type/name is app-managed and safe.
- DKIM unavailable: mark `manual`; do not block `verified` until Mailtrap integration defines DKIM records.

## Testing

Automated tests:

- Expected DNS record generation for `freakyswan.my.id` and arbitrary domains.
- DNS comparison for valid, missing, mismatch, and manual records.
- Cloudflare adapter maps API records into `DnsRecord` objects using fake fetch.
- Server action/service behavior updates domain status and audit logs for check/apply paths where practical.

Manual/browser smoke:

- Create or select domain in `/dashboard/domains`.
- See Cloudflare config status.
- Run `Check DNS` and see record statuses.
- Run `Apply fixes` with mocked or real Cloudflare config.
- Confirm audit log shows DNS check/apply entries.

## Acceptance criteria

- Owner can add a domain from dashboard.
- Owner can see expected DNS records for email setup.
- App can read Cloudflare DNS records with env config.
- App can classify each required record as valid, missing, mismatch, or manual.
- App can create missing safe DNS records in Cloudflare.
- Domain status updates based on DNS health.
- Audit log records create/check/apply/failure events.
- Tests, typecheck, lint, build, and browser smoke pass.
