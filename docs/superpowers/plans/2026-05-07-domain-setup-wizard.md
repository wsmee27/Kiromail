# Domain Setup Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Cloudflare-connected domain setup wizard and DNS health checker for SwanMail.

**Architecture:** Keep DNS business logic provider-agnostic. Add deterministic DNS record generation/comparison services, a Cloudflare adapter behind `DnsProvider`, server actions for create/check/apply, and an upgraded `/dashboard/domains` page that displays setup status and last verification snapshot.

**Tech Stack:** Next.js App Router server actions, TypeScript, Prisma/PostgreSQL, Vitest, Cloudflare DNS API via `fetch`.

---

## File Structure

Create:

- `apps/web/lib/dns/records.ts` — expected MVP email DNS record generation.
- `apps/web/lib/dns/compare.ts` — compare expected records with provider records and compute aggregate status.
- `apps/web/lib/dns/cloudflare.ts` — Cloudflare DNS provider using env config and `fetch`.
- `apps/web/lib/dns/service.ts` — provider-agnostic check/apply orchestration.
- `apps/web/app/actions/domains.ts` — domain create, check, and apply server actions.
- `apps/web/tests/dns-records.test.ts` — expected record tests.
- `apps/web/tests/dns-compare.test.ts` — record comparison/status tests.
- `apps/web/tests/cloudflare-dns.test.ts` — Cloudflare adapter tests with fake fetch.

Modify:

- `apps/web/prisma/schema.prisma` — add `Domain.verificationRecords Json @default("[]")`.
- `apps/web/prisma/seed.ts` — keep seed compatible with new domain field defaults.
- `.env.example` — add Cloudflare env keys.
- `apps/web/lib/providers/types.ts` — extend DNS record/verification types for apply/check use.
- `apps/web/lib/validation/schemas.ts` — add `domainInputSchema` and `domainActionSchema`.
- `apps/web/app/dashboard/domains/page.tsx` — replace placeholder list with wizard and DNS health UI.

---

### Task 1: Add DNS record generation

**Files:**
- Create: `apps/web/lib/dns/records.ts`
- Test: `apps/web/tests/dns-records.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/tests/dns-records.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getExpectedEmailDnsRecords } from "@/lib/dns/records";

describe("expected email DNS records", () => {
  it("generates Cloudflare Email Routing MX, SPF, DMARC, and manual DKIM records", () => {
    const records = getExpectedEmailDnsRecords("freakyswan.my.id");

    expect(records).toEqual([
      {
        type: "MX",
        name: "freakyswan.my.id",
        value: "route1.mx.cloudflare.net",
        priority: 82,
        mode: "required",
        notes: "Cloudflare Email Routing inbound MX"
      },
      {
        type: "MX",
        name: "freakyswan.my.id",
        value: "route2.mx.cloudflare.net",
        priority: 23,
        mode: "required",
        notes: "Cloudflare Email Routing inbound MX"
      },
      {
        type: "MX",
        name: "freakyswan.my.id",
        value: "route3.mx.cloudflare.net",
        priority: 39,
        mode: "required",
        notes: "Cloudflare Email Routing inbound MX"
      },
      {
        type: "TXT",
        name: "freakyswan.my.id",
        value: "v=spf1 include:_spf.mx.cloudflare.net ~all",
        mode: "required",
        notes: "MVP SPF allows Cloudflare Email Routing only"
      },
      {
        type: "TXT",
        name: "_dmarc.freakyswan.my.id",
        value: "v=DMARC1; p=none; rua=mailto:security@freakyswan.my.id",
        mode: "required",
        notes: "Start DMARC at monitoring mode"
      },
      {
        type: "TXT",
        name: "mailtrap._domainkey.freakyswan.my.id",
        value: "Pending Mailtrap DKIM selector",
        mode: "manual",
        notes: "Manual until Mailtrap adapter provides concrete DKIM value"
      }
    ]);
  });
});
```

- [ ] **Step 2: Run red test**

Run:

```powershell
pnpm --filter @swanmail/web test:run dns-records.test.ts
```

Expected: FAIL because `@/lib/dns/records` does not exist.

- [ ] **Step 3: Implement minimal record generation**

Create `apps/web/lib/dns/records.ts`:

```ts
export type ExpectedDnsRecord = {
  type: "MX" | "TXT";
  name: string;
  value: string;
  priority?: number;
  mode: "required" | "manual";
  notes: string;
};

export function getExpectedEmailDnsRecords(domain: string): ExpectedDnsRecord[] {
  const normalizedDomain = domain.toLowerCase();

  return [
    {
      type: "MX",
      name: normalizedDomain,
      value: "route1.mx.cloudflare.net",
      priority: 82,
      mode: "required",
      notes: "Cloudflare Email Routing inbound MX"
    },
    {
      type: "MX",
      name: normalizedDomain,
      value: "route2.mx.cloudflare.net",
      priority: 23,
      mode: "required",
      notes: "Cloudflare Email Routing inbound MX"
    },
    {
      type: "MX",
      name: normalizedDomain,
      value: "route3.mx.cloudflare.net",
      priority: 39,
      mode: "required",
      notes: "Cloudflare Email Routing inbound MX"
    },
    {
      type: "TXT",
      name: normalizedDomain,
      value: "v=spf1 include:_spf.mx.cloudflare.net ~all",
      mode: "required",
      notes: "MVP SPF allows Cloudflare Email Routing only"
    },
    {
      type: "TXT",
      name: `_dmarc.${normalizedDomain}`,
      value: `v=DMARC1; p=none; rua=mailto:security@${normalizedDomain}`,
      mode: "required",
      notes: "Start DMARC at monitoring mode"
    },
    {
      type: "TXT",
      name: `mailtrap._domainkey.${normalizedDomain}`,
      value: "Pending Mailtrap DKIM selector",
      mode: "manual",
      notes: "Manual until Mailtrap adapter provides concrete DKIM value"
    }
  ];
}
```

- [ ] **Step 4: Run green test**

Run:

```powershell
pnpm --filter @swanmail/web test:run dns-records.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/lib/dns/records.ts apps/web/tests/dns-records.test.ts
git commit -m "feat: add expected email DNS records"
```

---

### Task 2: Add DNS record comparison

**Files:**
- Create: `apps/web/lib/dns/compare.ts`
- Test: `apps/web/tests/dns-compare.test.ts`
- Modify: `apps/web/lib/providers/types.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/tests/dns-compare.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compareDnsRecords, getAggregateDomainStatus } from "@/lib/dns/compare";
import type { ExpectedDnsRecord } from "@/lib/dns/records";
import type { DnsRecord } from "@/lib/providers/types";

const expected: ExpectedDnsRecord[] = [
  { type: "MX", name: "example.com", value: "route1.mx.cloudflare.net", priority: 82, mode: "required", notes: "MX" },
  { type: "TXT", name: "example.com", value: "v=spf1 include:_spf.mx.cloudflare.net ~all", mode: "required", notes: "SPF" },
  { type: "TXT", name: "mailtrap._domainkey.example.com", value: "Pending Mailtrap DKIM selector", mode: "manual", notes: "DKIM" }
];

const actual: DnsRecord[] = [
  { id: "mx-1", type: "MX", name: "example.com", value: "route1.mx.cloudflare.net", priority: 82 },
  { id: "spf-1", type: "TXT", name: "example.com", value: "v=spf1 include:_spf.mx.cloudflare.net ~all" }
];

describe("DNS record comparison", () => {
  it("classifies valid and manual records", () => {
    expect(compareDnsRecords(expected, actual)).toEqual([
      { ...expected[0], currentValue: "route1.mx.cloudflare.net", status: "valid" },
      { ...expected[1], currentValue: "v=spf1 include:_spf.mx.cloudflare.net ~all", status: "valid" },
      { ...expected[2], currentValue: null, status: "manual" }
    ]);
  });

  it("classifies missing and mismatched records", () => {
    const result = compareDnsRecords(expected.slice(0, 2), [
      { id: "spf-1", type: "TXT", name: "example.com", value: "v=spf1 -all" }
    ]);

    expect(result[0].status).toBe("missing");
    expect(result[0].currentValue).toBeNull();
    expect(result[1].status).toBe("mismatch");
    expect(result[1].currentValue).toBe("v=spf1 -all");
  });

  it("maps aggregate status", () => {
    expect(getAggregateDomainStatus([{ status: "valid" }, { status: "manual" }])).toBe("verified");
    expect(getAggregateDomainStatus([{ status: "mismatch" }])).toBe("degraded");
    expect(getAggregateDomainStatus([{ status: "missing" }])).toBe("pending");
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
pnpm --filter @swanmail/web test:run dns-compare.test.ts
```

Expected: FAIL because `@/lib/dns/compare` does not exist and `DnsRecord.id/priority` are missing.

- [ ] **Step 3: Extend DNS types**

Modify `apps/web/lib/providers/types.ts` `DnsRecord` type to:

```ts
export type DnsRecord = {
  id?: string;
  type: string;
  name: string;
  value: string;
  priority?: number;
};
```

- [ ] **Step 4: Implement comparison**

Create `apps/web/lib/dns/compare.ts`:

```ts
import type { DomainStatus } from "@prisma/client";
import type { DnsRecord } from "@/lib/providers/types";
import type { ExpectedDnsRecord } from "@/lib/dns/records";

export type DnsRecordStatus = "valid" | "missing" | "mismatch" | "manual";

export type DnsRecordCheck = ExpectedDnsRecord & {
  currentValue: string | null;
  status: DnsRecordStatus;
};

function normalize(value: string) {
  return value.trim().replace(/^"|"$/g, "").toLowerCase();
}

function matches(expected: ExpectedDnsRecord, actual: DnsRecord) {
  if (actual.type.toUpperCase() !== expected.type) return false;
  if (actual.name.toLowerCase() !== expected.name.toLowerCase()) return false;
  if (expected.priority !== undefined && actual.priority !== expected.priority) return false;
  return normalize(actual.value) === normalize(expected.value);
}

function sameNameAndType(expected: ExpectedDnsRecord, actual: DnsRecord) {
  return actual.type.toUpperCase() === expected.type && actual.name.toLowerCase() === expected.name.toLowerCase();
}

export function compareDnsRecords(expectedRecords: ExpectedDnsRecord[], actualRecords: DnsRecord[]): DnsRecordCheck[] {
  return expectedRecords.map((expected) => {
    if (expected.mode === "manual") {
      const current = actualRecords.find((record) => sameNameAndType(expected, record));
      return { ...expected, currentValue: current?.value ?? null, status: "manual" };
    }

    const exact = actualRecords.find((record) => matches(expected, record));
    if (exact) {
      return { ...expected, currentValue: exact.value, status: "valid" };
    }

    const conflicting = actualRecords.find((record) => sameNameAndType(expected, record));
    if (conflicting) {
      return { ...expected, currentValue: conflicting.value, status: "mismatch" };
    }

    return { ...expected, currentValue: null, status: "missing" };
  });
}

export function getAggregateDomainStatus(records: Array<{ status: DnsRecordStatus }>): DomainStatus {
  if (records.some((record) => record.status === "mismatch")) return "degraded";
  if (records.some((record) => record.status === "missing")) return "pending";
  return "verified";
}
```

- [ ] **Step 5: Run green test**

```powershell
pnpm --filter @swanmail/web test:run dns-compare.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add apps/web/lib/providers/types.ts apps/web/lib/dns/compare.ts apps/web/tests/dns-compare.test.ts
git commit -m "feat: add DNS health comparison"
```

---

### Task 3: Add Cloudflare DNS adapter

**Files:**
- Create: `apps/web/lib/dns/cloudflare.ts`
- Test: `apps/web/tests/cloudflare-dns.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/tests/cloudflare-dns.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { CloudflareDnsProvider, getCloudflareConfig } from "@/lib/dns/cloudflare";

const apiResponse = {
  success: true,
  result: [
    { id: "1", type: "MX", name: "example.com", content: "route1.mx.cloudflare.net", priority: 82 },
    { id: "2", type: "TXT", name: "example.com", content: "v=spf1 include:_spf.mx.cloudflare.net ~all" }
  ]
};

describe("Cloudflare DNS provider", () => {
  it("reports missing config", () => {
    expect(getCloudflareConfig({})).toEqual({ configured: false, token: null, zoneId: null });
  });

  it("maps Cloudflare DNS records", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => apiResponse });
    const provider = new CloudflareDnsProvider({ token: "token", zoneId: "zone", fetcher });

    await expect(provider.getRecords("example.com")).resolves.toEqual([
      { id: "1", type: "MX", name: "example.com", value: "route1.mx.cloudflare.net", priority: 82 },
      { id: "2", type: "TXT", name: "example.com", value: "v=spf1 include:_spf.mx.cloudflare.net ~all", priority: undefined }
    ]);

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/zones/zone/dns_records?name=example.com",
      { headers: { Authorization: "Bearer token" } }
    );
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
pnpm --filter @swanmail/web test:run cloudflare-dns.test.ts
```

Expected: FAIL because `@/lib/dns/cloudflare` does not exist.

- [ ] **Step 3: Implement adapter**

Create `apps/web/lib/dns/cloudflare.ts`:

```ts
import type { DnsProvider, DnsRecord, DomainVerificationResult } from "@/lib/providers/types";

type CloudflareRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  priority?: number;
};

type CloudflareResponse = {
  success: boolean;
  result: CloudflareRecord[];
  errors?: Array<{ message: string }>;
};

type Fetcher = typeof fetch;

type CloudflareProviderOptions = {
  token: string;
  zoneId: string;
  fetcher?: Fetcher;
};

export function getCloudflareConfig(env: Record<string, string | undefined> = process.env) {
  const token = env.CLOUDFLARE_API_TOKEN ?? null;
  const zoneId = env.CLOUDFLARE_ZONE_ID ?? null;

  return { configured: Boolean(token && zoneId), token, zoneId };
}

export class CloudflareDnsProvider implements DnsProvider {
  private readonly token: string;
  private readonly zoneId: string;
  private readonly fetcher: Fetcher;

  constructor(options: CloudflareProviderOptions) {
    this.token = options.token;
    this.zoneId = options.zoneId;
    this.fetcher = options.fetcher ?? fetch;
  }

  async getRecords(domain: string): Promise<DnsRecord[]> {
    const response = await this.fetcher(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(domain)}`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );

    if (!response.ok) {
      throw new Error("Cloudflare DNS request failed");
    }

    const body = (await response.json()) as CloudflareResponse;

    if (!body.success) {
      throw new Error(body.errors?.[0]?.message ?? "Cloudflare DNS request failed");
    }

    return body.result.map((record) => ({
      id: record.id,
      type: record.type,
      name: record.name,
      value: record.content,
      priority: record.priority
    }));
  }

  async verifyEmailRecords(domain: string): Promise<DomainVerificationResult> {
    return {
      domain,
      status: "pending",
      records: (await this.getRecords(domain)).map((record) => ({
        type: record.type,
        name: record.name,
        value: record.value,
        valid: false
      }))
    };
  }

  async createRecord(record: { type: string; name: string; value: string; priority?: number }) {
    const response = await this.fetcher(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: record.type, name: record.name, content: record.value, priority: record.priority })
      }
    );

    if (!response.ok) {
      throw new Error("Cloudflare DNS create failed");
    }
  }
}
```

- [ ] **Step 4: Run green test**

```powershell
pnpm --filter @swanmail/web test:run cloudflare-dns.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/lib/dns/cloudflare.ts apps/web/tests/cloudflare-dns.test.ts
git commit -m "feat: add Cloudflare DNS provider"
```

---

### Task 4: Add DNS health service and Prisma snapshot field

**Files:**
- Create: `apps/web/lib/dns/service.ts`
- Modify: `apps/web/prisma/schema.prisma`
- Test: `apps/web/tests/dns-service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/tests/dns-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyMissingDnsRecords, getDomainDnsHealth } from "@/lib/dns/service";
import type { DnsProvider } from "@/lib/providers/types";

class FakeDnsProvider implements DnsProvider {
  public created: Array<{ type: string; name: string; value: string; priority?: number }> = [];

  constructor(private readonly records: Array<{ type: string; name: string; value: string; priority?: number }> = []) {}

  async getRecords() {
    return this.records;
  }

  async verifyEmailRecords(domain: string) {
    return { domain, status: "pending" as const, records: [] };
  }

  async createRecord(record: { type: string; name: string; value: string; priority?: number }) {
    this.created.push(record);
  }
}

describe("DNS health service", () => {
  it("returns health snapshot and aggregate status", async () => {
    const provider = new FakeDnsProvider([
      { type: "TXT", name: "example.com", value: "v=spf1 -all" }
    ]);

    const health = await getDomainDnsHealth("example.com", provider);

    expect(health.status).toBe("degraded");
    expect(health.records.some((record) => record.status === "mismatch")).toBe(true);
  });

  it("creates only missing required records", async () => {
    const provider = new FakeDnsProvider();
    const result = await applyMissingDnsRecords("example.com", provider);

    expect(result.created).toBe(5);
    expect(provider.created.every((record) => record.value !== "Pending Mailtrap DKIM selector")).toBe(true);
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
pnpm --filter @swanmail/web test:run dns-service.test.ts
```

Expected: FAIL because `@/lib/dns/service` does not exist and `DnsProvider.createRecord` is missing.

- [ ] **Step 3: Extend provider type**

Modify `apps/web/lib/providers/types.ts` `DnsProvider` interface:

```ts
export interface DnsProvider {
  getRecords(domain: string): Promise<DnsRecord[]>;
  verifyEmailRecords(domain: string): Promise<DomainVerificationResult>;
  createRecord?(record: { type: string; name: string; value: string; priority?: number }): Promise<void>;
}
```

- [ ] **Step 4: Add Prisma field**

Modify `apps/web/prisma/schema.prisma` `Domain` model:

```prisma
model Domain {
  id                  String         @id @default(cuid())
  domain              String         @unique
  provider            String
  status              DomainStatus   @default(pending)
  verificationRecords Json           @default("[]")
  isPrimary           Boolean        @default(false)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  mailboxes           Mailbox[]
  aliases             Alias[]
  routingRules        RoutingRule[]
}
```

Run:

```powershell
pnpm db:generate
```

Expected: Prisma client generated successfully.

- [ ] **Step 5: Implement service**

Create `apps/web/lib/dns/service.ts`:

```ts
import type { DomainStatus } from "@prisma/client";
import { compareDnsRecords, getAggregateDomainStatus, type DnsRecordCheck } from "@/lib/dns/compare";
import { getExpectedEmailDnsRecords } from "@/lib/dns/records";
import type { DnsProvider } from "@/lib/providers/types";

export type DomainDnsHealth = {
  domain: string;
  status: DomainStatus;
  records: DnsRecordCheck[];
};

export async function getDomainDnsHealth(domain: string, provider: DnsProvider): Promise<DomainDnsHealth> {
  const expected = getExpectedEmailDnsRecords(domain);
  const actual = await provider.getRecords(domain);
  const records = compareDnsRecords(expected, actual);

  return {
    domain,
    status: getAggregateDomainStatus(records),
    records
  };
}

export async function applyMissingDnsRecords(domain: string, provider: DnsProvider) {
  if (!provider.createRecord) {
    throw new Error("DNS provider does not support applying records");
  }

  const health = await getDomainDnsHealth(domain, provider);
  const missingRequired = health.records.filter((record) => record.mode === "required" && record.status === "missing");

  for (const record of missingRequired) {
    await provider.createRecord({ type: record.type, name: record.name, value: record.value, priority: record.priority });
  }

  return { created: missingRequired.length };
}
```

- [ ] **Step 6: Run green test**

```powershell
pnpm --filter @swanmail/web test:run dns-service.test.ts
```

Expected: PASS.

- [ ] **Step 7: Create migration**

Run:

```powershell
pnpm db:migrate -- --name domain-verification-records
```

Expected: migration created and applied locally.

- [ ] **Step 8: Commit**

```powershell
git add apps/web/lib/providers/types.ts apps/web/prisma/schema.prisma apps/web/prisma/migrations apps/web/lib/dns/service.ts apps/web/tests/dns-service.test.ts
git commit -m "feat: add domain DNS health service"
```

---

### Task 5: Add domain server actions

**Files:**
- Create: `apps/web/app/actions/domains.ts`
- Modify: `apps/web/lib/validation/schemas.ts`

- [ ] **Step 1: Write domain validation test**

Modify `apps/web/tests/validation.test.ts` import:

```ts
import { aliasInputSchema, domainInputSchema, mailboxInputSchema } from "@/lib/validation/schemas";
```

Add test:

```ts
it("validates domain input", () => {
  expect(domainInputSchema.safeParse({ domain: "freakyswan.my.id" }).success).toBe(true);
  expect(domainInputSchema.safeParse({ domain: "bad domain" }).success).toBe(false);
});
```

- [ ] **Step 2: Run red test**

```powershell
pnpm --filter @swanmail/web test:run validation.test.ts
```

Expected: FAIL because `domainInputSchema` is not exported.

- [ ] **Step 3: Add domain schema**

Modify `apps/web/lib/validation/schemas.ts`:

```ts
export const domainInputSchema = z.object({
  domain: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/, "Invalid domain")
});
```

- [ ] **Step 4: Run green test**

```powershell
pnpm --filter @swanmail/web test:run validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add actions**

Create `apps/web/app/actions/domains.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { getCloudflareConfig, CloudflareDnsProvider } from "@/lib/dns/cloudflare";
import { applyMissingDnsRecords, getDomainDnsHealth } from "@/lib/dns/service";
import { domainInputSchema } from "@/lib/validation/schemas";

function getConfiguredCloudflareProvider() {
  const config = getCloudflareConfig();

  if (!config.configured || !config.token || !config.zoneId) {
    return null;
  }

  return new CloudflareDnsProvider({ token: config.token, zoneId: config.zoneId });
}

export async function createDomainAction(formData: FormData) {
  const session = await requireOwner();
  const input = domainInputSchema.parse({ domain: String(formData.get("domain") ?? "") });

  const domain = await prisma.domain.upsert({
    where: { domain: input.domain },
    update: { provider: "cloudflare" },
    create: { domain: input.domain, provider: "cloudflare" }
  });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "domain.create",
    resourceType: "domain",
    resourceId: domain.id,
    metadata: { domain: domain.domain }
  });

  revalidatePath("/dashboard/domains");
}

export async function checkDomainDnsAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const domain = await prisma.domain.findUniqueOrThrow({ where: { id } });
  const provider = getConfiguredCloudflareProvider();

  if (!provider) {
    await createAuditLog(prisma, {
      actorUserId: session.userId,
      action: "domain.dns_check_failed",
      resourceType: "domain",
      resourceId: domain.id,
      metadata: { domain: domain.domain, reason: "cloudflare_not_configured" }
    });
    revalidatePath("/dashboard/domains");
    return;
  }

  try {
    const health = await getDomainDnsHealth(domain.domain, provider);
    await prisma.domain.update({
      where: { id: domain.id },
      data: { status: health.status, verificationRecords: health.records }
    });
    await createAuditLog(prisma, {
      actorUserId: session.userId,
      action: "domain.dns_check",
      resourceType: "domain",
      resourceId: domain.id,
      metadata: { domain: domain.domain, status: health.status }
    });
  } catch (error) {
    await createAuditLog(prisma, {
      actorUserId: session.userId,
      action: "domain.dns_check_failed",
      resourceType: "domain",
      resourceId: domain.id,
      metadata: { domain: domain.domain, reason: error instanceof Error ? error.message : "unknown" }
    });
  }

  revalidatePath("/dashboard/domains");
}

export async function applyDomainDnsFixesAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const domain = await prisma.domain.findUniqueOrThrow({ where: { id } });
  const provider = getConfiguredCloudflareProvider();

  if (!provider) {
    await createAuditLog(prisma, {
      actorUserId: session.userId,
      action: "domain.dns_apply_failed",
      resourceType: "domain",
      resourceId: domain.id,
      metadata: { domain: domain.domain, reason: "cloudflare_not_configured" }
    });
    revalidatePath("/dashboard/domains");
    return;
  }

  try {
    const applyResult = await applyMissingDnsRecords(domain.domain, provider);
    const health = await getDomainDnsHealth(domain.domain, provider);
    await prisma.domain.update({
      where: { id: domain.id },
      data: { status: health.status, verificationRecords: health.records }
    });
    await createAuditLog(prisma, {
      actorUserId: session.userId,
      action: "domain.dns_apply",
      resourceType: "domain",
      resourceId: domain.id,
      metadata: { domain: domain.domain, created: applyResult.created, status: health.status }
    });
  } catch (error) {
    await createAuditLog(prisma, {
      actorUserId: session.userId,
      action: "domain.dns_apply_failed",
      resourceType: "domain",
      resourceId: domain.id,
      metadata: { domain: domain.domain, reason: error instanceof Error ? error.message : "unknown" }
    });
  }

  revalidatePath("/dashboard/domains");
}
```

- [ ] **Step 6: Run typecheck**

```powershell
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add apps/web/lib/validation/schemas.ts apps/web/tests/validation.test.ts apps/web/app/actions/domains.ts
git commit -m "feat: add domain DNS server actions"
```

---

### Task 6: Build domain wizard UI

**Files:**
- Modify: `apps/web/app/dashboard/domains/page.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Update env example**

Modify `.env.example`:

```env
DATABASE_URL="postgresql://swanmail:swanmail@localhost:5432/swanmail?schema=public"
SESSION_PASSWORD="development-session-password-32chars-min"
APP_ENCRYPTION_KEY="development-encryption-key-32chars-min"
SEED_OWNER_EMAIL="owner@example.com"
SEED_OWNER_PASSWORD="replace-with-a-strong-password"
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ZONE_ID=""
```

- [ ] **Step 2: Replace domains page**

Modify `apps/web/app/dashboard/domains/page.tsx`:

```tsx
import { createDomainAction, applyDomainDnsFixesAction, checkDomainDnsAction } from "@/app/actions/domains";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getCloudflareConfig } from "@/lib/dns/cloudflare";
import { getExpectedEmailDnsRecords } from "@/lib/dns/records";
import type { DnsRecordCheck } from "@/lib/dns/compare";

export const dynamic = "force-dynamic";

const badgeClass: Record<string, string> = {
  verified: "bg-emerald-400/10 text-emerald-300",
  degraded: "bg-amber-400/10 text-amber-300",
  pending: "bg-slate-400/10 text-slate-300",
  disabled: "bg-rose-400/10 text-rose-300",
  valid: "bg-emerald-400/10 text-emerald-300",
  missing: "bg-slate-400/10 text-slate-300",
  mismatch: "bg-amber-400/10 text-amber-300",
  manual: "bg-cyan-400/10 text-cyan-300"
};

function recordRows(records: unknown, fallbackDomain: string): DnsRecordCheck[] {
  if (Array.isArray(records) && records.length > 0) {
    return records as DnsRecordCheck[];
  }

  return getExpectedEmailDnsRecords(fallbackDomain).map((record) => ({
    ...record,
    currentValue: null,
    status: record.mode === "manual" ? "manual" : "missing"
  }));
}

export default async function DomainsPage() {
  const domains = await prisma.domain.findMany({ orderBy: { createdAt: "desc" } });
  const cloudflare = getCloudflareConfig();
  const selectedDomain = domains[0];
  const records = selectedDomain ? recordRows(selectedDomain.verificationRecords, selectedDomain.domain) : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold">Domains</h1>
      <p className="mt-2 text-slate-400">Add domains, check Cloudflare DNS, and apply safe email DNS fixes.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <h2 className="text-xl font-semibold">Domain setup wizard</h2>
          <p className="mt-2 text-sm text-slate-400">
            Cloudflare status: {cloudflare.configured ? "configured" : "not configured"}
          </p>

          <form action={createDomainAction} className="mt-6 flex gap-3">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-500 focus:ring-2"
              name="domain"
              placeholder="freakyswan.my.id"
              required
            />
            <button className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300" type="submit">
              Add domain
            </button>
          </form>

          {selectedDomain ? (
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{selectedDomain.domain}</h3>
                  <p className="text-sm text-slate-400">Provider: {selectedDomain.provider}</p>
                </div>
                <div className="flex gap-2">
                  <form action={checkDomainDnsAction}>
                    <input name="id" type="hidden" value={selectedDomain.id} />
                    <button className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-cyan-400" type="submit">
                      Check DNS
                    </button>
                  </form>
                  <form action={applyDomainDnsFixesAction}>
                    <input name="id" type="hidden" value={selectedDomain.id} />
                    <button className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300" disabled={!cloudflare.configured} type="submit">
                      Apply fixes
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Expected</th>
                      <th className="px-4 py-3">Current</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {records.map((record) => (
                      <tr key={`${record.type}-${record.name}-${record.value}`}>
                        <td className="px-4 py-3 text-slate-300">{record.type}</td>
                        <td className="px-4 py-3 text-slate-300">{record.name}</td>
                        <td className="px-4 py-3 text-slate-400">{record.value}</td>
                        <td className="px-4 py-3 text-slate-400">{record.currentValue ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs ${badgeClass[record.status]}`}>{record.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-8 text-sm text-slate-400">Add a domain to see required DNS records.</p>
          )}
        </Card>

        <div className="grid gap-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{domain.domain}</h2>
                  <p className="text-sm text-slate-400">Provider: {domain.provider}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm ${badgeClass[domain.status]}`}>{domain.status}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run checks**

```powershell
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all pass.

- [ ] **Step 4: Browser smoke**

Run:

```powershell
pnpm dev
```

In browser:

1. Login as seeded owner.
2. Open `/dashboard/domains`.
3. Confirm wizard appears.
4. Add `example.com` or test domain.
5. Click `Check DNS` with Cloudflare env blank; page should not crash.
6. Confirm `/dashboard/logs` shows `domain.create` and `domain.dns_check_failed`.

- [ ] **Step 5: Commit**

```powershell
git add .env.example apps/web/app/dashboard/domains/page.tsx
git commit -m "feat: add domain setup wizard UI"
```

---

### Task 7: Final verification and PR

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run full verification**

```powershell
pnpm db:generate
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all pass.

- [ ] **Step 2: Run browser smoke**

Expected:

- login works.
- `/dashboard/domains` loads.
- domain creation works.
- DNS check failure path with missing env is safe.
- audit log shows domain actions.

- [ ] **Step 3: Review git status**

```powershell
git status --short
```

Expected: no unstaged changes after commits, except ignored local files.

- [ ] **Step 4: Push and create PR**

```powershell
git push -u origin <branch-name>
gh pr create --title "Add domain setup wizard" --body "Adds Cloudflare-connected domain setup wizard and DNS health checker."
```

Expected: PR created.

---

## Self-Review Notes

Spec coverage:

- Cloudflare env-only config: Task 3 and Task 6.
- Provider boundary: Task 3 and Task 4.
- Expected records: Task 1.
- Live comparison: Task 2 and Task 4.
- Safe apply flow: Task 4 and Task 5.
- Audit logs: Task 5.
- UI wizard: Task 6.
- Snapshot field: Task 4.
- Tests/browser smoke: Tasks 1-7.

Placeholder scan: no TBD/TODO placeholders.

Type consistency:

- `ExpectedDnsRecord`, `DnsRecordCheck`, `DnsProvider`, `DomainDnsHealth`, and action names are defined before use.
- Prisma field name `verificationRecords` is consistent across schema and UI.
