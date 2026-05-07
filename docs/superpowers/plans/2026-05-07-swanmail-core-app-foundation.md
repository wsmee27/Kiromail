# SwanMail Core App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build runnable SwanMail foundation with Next.js, Prisma/PostgreSQL, owner auth, core email identity records, audit logs, provider stubs, and documented commands.

**Architecture:** Use a light monorepo: `apps/web` contains the first Next.js app and Prisma code; `infra` contains local PostgreSQL Docker Compose; provider interfaces live under `apps/web/lib/providers` and prevent Cloudflare/Mailtrap hardcoding. First slice stores email metadata only and uses mock provider implementations.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Docker Compose, Zod, bcryptjs, iron-session, Vitest.

---

## File structure

Create these files/directories:

- `package.json` — workspace scripts that run app commands from repo root.
- `pnpm-workspace.yaml` — workspace includes `apps/*` and `packages/*`.
- `.gitignore` — ignore dependencies, build output, env files, Prisma local DB artifacts.
- `.env.example` — required local env variables.
- `infra/docker-compose.yml` — local PostgreSQL service.
- `apps/web/package.json` — app dependencies and scripts.
- `apps/web/next.config.ts` — Next.js config.
- `apps/web/tsconfig.json` — app TypeScript config.
- `apps/web/vitest.config.ts` — Vitest config.
- `apps/web/postcss.config.mjs` — Tailwind PostCSS config.
- `apps/web/tailwind.config.ts` — Tailwind content/theme config.
- `apps/web/app/globals.css` — Tailwind base styles and premium dashboard tokens.
- `apps/web/app/layout.tsx` — root layout.
- `apps/web/app/page.tsx` — redirect to dashboard/login.
- `apps/web/app/login/page.tsx` — owner login UI.
- `apps/web/app/dashboard/layout.tsx` — protected dashboard shell.
- `apps/web/app/dashboard/page.tsx` — summary cards.
- `apps/web/app/dashboard/domains/page.tsx` — domain list.
- `apps/web/app/dashboard/mailboxes/page.tsx` — mailbox list and form.
- `apps/web/app/dashboard/aliases/page.tsx` — alias list and form.
- `apps/web/app/dashboard/rules/page.tsx` — rule list and form.
- `apps/web/app/dashboard/logs/page.tsx` — audit/event logs.
- `apps/web/app/dashboard/settings/page.tsx` — owner/settings/provider status.
- `apps/web/app/actions/auth.ts` — login/logout server actions.
- `apps/web/app/actions/mailboxes.ts` — mailbox mutations.
- `apps/web/app/actions/aliases.ts` — alias mutations.
- `apps/web/app/actions/routing-rules.ts` — routing rule mutations.
- `apps/web/lib/auth/session.ts` — session helpers and auth guard.
- `apps/web/lib/auth/password.ts` — password hashing/verify helpers.
- `apps/web/lib/db.ts` — Prisma singleton.
- `apps/web/lib/audit.ts` — audit log helper.
- `apps/web/lib/validation/email.ts` — local-part and address helpers.
- `apps/web/lib/validation/schemas.ts` — Zod input schemas.
- `apps/web/lib/providers/types.ts` — provider interfaces.
- `apps/web/lib/providers/mock.ts` — mock providers.
- `apps/web/components/dashboard/nav.tsx` — sidebar navigation.
- `apps/web/components/ui/button.tsx` — shared button.
- `apps/web/components/ui/input.tsx` — shared input.
- `apps/web/components/ui/card.tsx` — shared card.
- `apps/web/prisma/schema.prisma` — data model.
- `apps/web/prisma/seed.ts` — owner/domain/mailbox seed.
- `apps/web/tests/validation.test.ts` — Zod/local-part tests.
- `apps/web/tests/password.test.ts` — password helper tests.
- `apps/web/tests/audit.test.ts` — audit helper integration-style test with mocked Prisma calls.
- Modify `CLAUDE.md` after scripts exist.

---

### Task 1: Create workspace skeleton and app package

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vitest.config.ts`

- [ ] **Step 1: Create root workspace files**

Create `package.json`:

```json
{
  "name": "swanmail",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "scripts": {
    "dev": "pnpm --filter @swanmail/web dev",
    "build": "pnpm --filter @swanmail/web build",
    "lint": "pnpm --filter @swanmail/web lint",
    "typecheck": "pnpm --filter @swanmail/web typecheck",
    "test": "pnpm --filter @swanmail/web test",
    "test:run": "pnpm --filter @swanmail/web test:run",
    "db:generate": "pnpm --filter @swanmail/web db:generate",
    "db:migrate": "pnpm --filter @swanmail/web db:migrate",
    "db:seed": "pnpm --filter @swanmail/web db:seed",
    "db:studio": "pnpm --filter @swanmail/web db:studio"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `.gitignore`:

```gitignore
node_modules
.next
.turbo
dist
coverage
.env
.env.*
!.env.example
*.log
.DS_Store
```

Create `.env.example`:

```txt
DATABASE_URL="postgresql://swanmail:swanmail@localhost:5432/swanmail?schema=public"
SESSION_PASSWORD="replace-with-at-least-32-characters"
SEED_OWNER_EMAIL="owner@example.com"
SEED_OWNER_PASSWORD="replace-with-a-strong-password"
```

- [ ] **Step 2: Create web package files**

Create `apps/web/package.json`:

```json
{
  "name": "@swanmail/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "latest",
    "bcryptjs": "latest",
    "clsx": "latest",
    "iron-session": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@testing-library/react": "latest",
    "@types/bcryptjs": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "jsdom": "latest",
    "postcss": "latest",
    "prisma": "latest",
    "tailwindcss": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Create `apps/web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`

Expected: lockfile created, dependencies installed.

- [ ] **Step 4: Run initial typecheck**

Run: `pnpm typecheck`

Expected: TypeScript may fail because app files do not exist yet. Continue to Task 2.

---

### Task 2: Add infrastructure and Prisma schema

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `apps/web/prisma/schema.prisma`
- Create: `apps/web/lib/db.ts`

- [ ] **Step 1: Create local PostgreSQL compose file**

Create `infra/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: swanmail-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: swanmail
      POSTGRES_PASSWORD: swanmail
      POSTGRES_DB: swanmail
    ports:
      - "5432:5432"
    volumes:
      - swanmail-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U swanmail -d swanmail"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  swanmail-postgres-data:
```

- [ ] **Step 2: Create Prisma schema**

Create `apps/web/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  owner
  admin
  member
}

enum UserStatus {
  active
  invited
  disabled
}

enum DomainStatus {
  pending
  verified
  degraded
  disabled
}

enum MailboxStatus {
  active
  inactive
  disabled
}

enum AliasType {
  custom
  service
  disposable
  catch_all_generated
}

enum AliasStatus {
  active
  disabled
  expired
  quarantined
}

enum RoutingAction {
  forward
  quarantine
  drop
  worker
  label
}

model User {
  id           String      @id @default(cuid())
  email        String      @unique
  name         String?
  passwordHash String
  role         UserRole    @default(member)
  status       UserStatus  @default(active)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  mailboxes    Mailbox[]
  aliases      Alias[]     @relation("AliasCreator")
  auditLogs    AuditLog[]
  aiPreferences AiPreference[]
}

model Domain {
  id          String       @id @default(cuid())
  domain      String       @unique
  provider    String
  status      DomainStatus @default(pending)
  isPrimary   Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  mailboxes    Mailbox[]
  aliases      Alias[]
  routingRules RoutingRule[]
}

model Mailbox {
  id               String        @id @default(cuid())
  domainId         String
  localPart        String
  address          String        @unique
  ownerUserId      String?
  inboxDestination String?
  sendEnabled      Boolean       @default(false)
  receiveEnabled   Boolean       @default(true)
  status           MailboxStatus @default(active)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  domain        Domain        @relation(fields: [domainId], references: [id], onDelete: Cascade)
  owner         User?         @relation(fields: [ownerUserId], references: [id], onDelete: SetNull)
  aliases       Alias[]
  emailEvents   EmailEvent[]
  aiPreferences AiPreference[]

  @@unique([domainId, localPart])
}

model Alias {
  id                   String      @id @default(cuid())
  domainId             String
  localPart            String
  address              String      @unique
  destinationMailboxId String?
  type                 AliasType   @default(custom)
  status               AliasStatus @default(active)
  expiresAt            DateTime?
  notes                String?
  tags                 String[]    @default([])
  createdById          String?
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt

  domain             Domain        @relation(fields: [domainId], references: [id], onDelete: Cascade)
  destinationMailbox Mailbox?      @relation(fields: [destinationMailboxId], references: [id], onDelete: SetNull)
  createdBy          User?         @relation("AliasCreator", fields: [createdById], references: [id], onDelete: SetNull)
  routingRules       RoutingRule[]
  emailEvents        EmailEvent[]

  @@unique([domainId, localPart])
}

model RoutingRule {
  id              String        @id @default(cuid())
  domainId        String
  aliasId         String?
  action          RoutingAction
  conditionJson   Json
  destinationJson Json
  priority        Int           @default(100)
  enabled         Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  domain Domain @relation(fields: [domainId], references: [id], onDelete: Cascade)
  alias  Alias? @relation(fields: [aliasId], references: [id], onDelete: SetNull)
}

model EmailEvent {
  id          String   @id @default(cuid())
  provider    String
  eventType   String
  messageId   String?
  fromAddress String?
  toAddress   String?
  aliasId     String?
  mailboxId   String?
  subjectHash String?
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())

  alias   Alias?   @relation(fields: [aliasId], references: [id], onDelete: SetNull)
  mailbox Mailbox? @relation(fields: [mailboxId], references: [id], onDelete: SetNull)
}

model AuditLog {
  id           String   @id @default(cuid())
  actorUserId  String?
  action       String
  resourceType String?
  resourceId   String?
  ipAddress    String?
  userAgent    String?
  metadata     Json     @default("{}")
  createdAt    DateTime @default(now())

  actor User? @relation(fields: [actorUserId], references: [id], onDelete: SetNull)
}

model AiPreference {
  id                   String   @id @default(cuid())
  userId               String
  mailboxId            String?
  aiBodyAccess         Boolean  @default(false)
  aiMetadataAccess     Boolean  @default(true)
  dailyDigestEnabled   Boolean  @default(false)
  phishingScoreEnabled Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mailbox Mailbox? @relation(fields: [mailboxId], references: [id], onDelete: Cascade)

  @@unique([userId, mailboxId])
}
```

- [ ] **Step 3: Create Prisma singleton**

Create `apps/web/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Generate Prisma client**

Run: `pnpm db:generate`

Expected: Prisma client generated successfully.

---

### Task 3: Add validation and password helpers with tests

**Files:**
- Create: `apps/web/lib/validation/email.ts`
- Create: `apps/web/lib/validation/schemas.ts`
- Create: `apps/web/lib/auth/password.ts`
- Create: `apps/web/tests/validation.test.ts`
- Create: `apps/web/tests/password.test.ts`

- [ ] **Step 1: Write validation tests**

Create `apps/web/tests/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildAddress, isValidLocalPart } from "@/lib/validation/email";
import { aliasInputSchema, mailboxInputSchema } from "@/lib/validation/schemas";

describe("email validation", () => {
  it("accepts simple local parts", () => {
    expect(isValidLocalPart("founder")).toBe(true);
    expect(isValidLocalPart("github-alerts")).toBe(true);
    expect(isValidLocalPart("billing_2026")).toBe(true);
  });

  it("rejects invalid local parts", () => {
    expect(isValidLocalPart("admin@")).toBe(false);
    expect(isValidLocalPart("two words")).toBe(false);
    expect(isValidLocalPart(".startdot")).toBe(false);
    expect(isValidLocalPart("enddot.")).toBe(false);
  });

  it("builds normalized address", () => {
    expect(buildAddress("Founder", "freakyswan.my.id")).toBe("founder@freakyswan.my.id");
  });

  it("validates mailbox input", () => {
    const result = mailboxInputSchema.safeParse({
      domainId: "domain_1",
      localPart: "founder",
      inboxDestination: "owner@gmail.com",
      sendEnabled: true,
      receiveEnabled: true,
      status: "active"
    });

    expect(result.success).toBe(true);
  });

  it("validates alias input", () => {
    const result = aliasInputSchema.safeParse({
      domainId: "domain_1",
      localPart: "github",
      destinationMailboxId: "mailbox_1",
      type: "service",
      status: "active",
      notes: "GitHub account",
      tags: ["service", "security"]
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Write password tests**

Create `apps/web/tests/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify failures**

Run: `pnpm --filter @swanmail/web test:run validation password`

Expected: FAIL because helper files do not exist.

- [ ] **Step 4: Implement validation helpers**

Create `apps/web/lib/validation/email.ts`:

```ts
const localPartPattern = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/i;

export function isValidLocalPart(value: string) {
  return localPartPattern.test(value) && !value.includes("..");
}

export function buildAddress(localPart: string, domain: string) {
  return `${localPart.toLowerCase()}@${domain.toLowerCase()}`;
}
```

Create `apps/web/lib/validation/schemas.ts`:

```ts
import { z } from "zod";
import { isValidLocalPart } from "@/lib/validation/email";

export const mailboxInputSchema = z.object({
  domainId: z.string().min(1),
  localPart: z.string().min(1).max(64).refine(isValidLocalPart, "Invalid email local-part"),
  inboxDestination: z.string().email().optional().or(z.literal("")),
  sendEnabled: z.boolean().default(false),
  receiveEnabled: z.boolean().default(true),
  status: z.enum(["active", "inactive", "disabled"]).default("active")
});

export const aliasInputSchema = z.object({
  domainId: z.string().min(1),
  localPart: z.string().min(1).max(64).refine(isValidLocalPart, "Invalid email local-part"),
  destinationMailboxId: z.string().optional().or(z.literal("")),
  type: z.enum(["custom", "service", "disposable", "catch_all_generated"]).default("custom"),
  status: z.enum(["active", "disabled", "expired", "quarantined"]).default("active"),
  expiresAt: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  tags: z.array(z.string().min(1)).default([])
});

export const routingRuleInputSchema = z.object({
  domainId: z.string().min(1),
  aliasId: z.string().optional().or(z.literal("")),
  action: z.enum(["forward", "quarantine", "drop", "worker", "label"]),
  conditionJson: z.string().min(2),
  destinationJson: z.string().min(2),
  priority: z.coerce.number().int().min(0).max(1000).default(100),
  enabled: z.boolean().default(true)
});
```

- [ ] **Step 5: Implement password helpers**

Create `apps/web/lib/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";

const saltRounds = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, saltRounds);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 6: Run tests to verify pass**

Run: `pnpm --filter @swanmail/web test:run validation password`

Expected: PASS.

---

### Task 4: Add seed script

**Files:**
- Create: `apps/web/prisma/seed.ts`

- [ ] **Step 1: Create seed script**

Create `apps/web/prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

const defaultMailboxes = [
  "founder",
  "hello",
  "team",
  "support",
  "admin",
  "billing",
  "security"
] as const;

const sensitiveTags = new Map<string, string[]>([
  ["admin", ["security", "ai-disabled"]],
  ["billing", ["billing", "ai-disabled"]],
  ["security", ["security", "ai-disabled"]]
]);

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD are required");
  }

  const owner = await prisma.user.upsert({
    where: { email },
    update: { role: "owner", status: "active" },
    create: {
      email,
      name: "FreakySwan",
      passwordHash: await hashPassword(password),
      role: "owner",
      status: "active"
    }
  });

  const domain = await prisma.domain.upsert({
    where: { domain: "freakyswan.my.id" },
    update: { provider: "cloudflare", isPrimary: true },
    create: {
      domain: "freakyswan.my.id",
      provider: "cloudflare",
      status: "pending",
      isPrimary: true
    }
  });

  for (const localPart of defaultMailboxes) {
    await prisma.mailbox.upsert({
      where: { address: `${localPart}@freakyswan.my.id` },
      update: {},
      create: {
        domainId: domain.id,
        localPart,
        address: `${localPart}@freakyswan.my.id`,
        ownerUserId: owner.id,
        inboxDestination: email,
        sendEnabled: localPart === "founder",
        receiveEnabled: true,
        status: "active"
      }
    });
  }

  for (const [localPart, tags] of sensitiveTags) {
    await prisma.alias.upsert({
      where: { address: `${localPart}@freakyswan.my.id` },
      update: { tags },
      create: {
        domainId: domain.id,
        localPart,
        address: `${localPart}@freakyswan.my.id`,
        type: "service",
        status: "active",
        tags,
        createdById: owner.id
      }
    });
  }

  await prisma.aiPreference.upsert({
    where: { userId_mailboxId: { userId: owner.id, mailboxId: null } },
    update: { aiBodyAccess: false, aiMetadataAccess: true },
    create: {
      userId: owner.id,
      mailboxId: null,
      aiBodyAccess: false,
      aiMetadataAccess: true,
      dailyDigestEnabled: false,
      phishingScoreEnabled: false
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Start database**

Run: `docker compose -f infra/docker-compose.yml up -d`

Expected: `swanmail-postgres` starts and becomes healthy.

- [ ] **Step 3: Run migration**

Run: `pnpm db:migrate --name init`

Expected: migration created and applied.

- [ ] **Step 4: Run seed**

Run: `pnpm db:seed`

Expected: owner, domain, mailboxes, sensitive aliases, and AI preference created.

---

### Task 5: Add session auth and login/logout

**Files:**
- Create: `apps/web/lib/auth/session.ts`
- Create: `apps/web/app/actions/auth.ts`
- Create: `apps/web/app/login/page.tsx`

- [ ] **Step 1: Create session helpers**

Create `apps/web/lib/auth/session.ts`:

```ts
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionData = {
  userId?: string;
  email?: string;
  role?: "owner" | "admin" | "member";
};

const sessionOptions = {
  cookieName: "swanmail_session",
  password: process.env.SESSION_PASSWORD ?? "development-password-must-be-at-least-32-chars",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const
  }
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireOwner() {
  const session = await getSession();

  if (!session.userId || session.role !== "owner") {
    redirect("/login");
  }

  return session;
}
```

- [ ] **Step 2: Create auth actions**

Create `apps/web/app/actions/auth.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== "active") {
    return { ok: false, error: "Invalid credentials" };
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    return { ok: false, error: "Invalid credentials" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.role = user.role;
  await session.save();

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "auth.login",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email }
    }
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
```

- [ ] **Step 3: Create login page**

Create `apps/web/app/login/page.tsx`:

```tsx
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <form action={loginAction} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">SwanMail</p>
          <h1 className="mt-3 text-2xl font-semibold">Owner login</h1>
          <p className="mt-2 text-sm text-slate-400">Access FreakySwan Mail OS dashboard.</p>
        </div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="email">Email</label>
        <input className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-500 focus:ring-2" id="email" name="email" type="email" required />
        <label className="mt-5 block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
        <input className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-500 focus:ring-2" id="password" name="password" type="password" required />
        <button className="mt-8 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">Sign in</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS after Next app files exist in next tasks; if layout missing, continue to Task 6 then rerun.

---

### Task 6: Add layout, dashboard shell, and UI primitives

**Files:**
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/dashboard/layout.tsx`
- Create: `apps/web/components/dashboard/nav.tsx`
- Create: `apps/web/components/ui/button.tsx`
- Create: `apps/web/components/ui/input.tsx`
- Create: `apps/web/components/ui/card.tsx`

- [ ] **Step 1: Add Tailwind config**

Create `apps/web/postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Create `apps/web/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#020617"
      }
    }
  },
  plugins: []
};

export default config;
```

- [ ] **Step 2: Add global styles and layout**

Create `apps/web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  background: #020617;
  color: #e2e8f0;
}
```

Create `apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwanMail",
  description: "FreakySwan Mail OS"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/web/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
```

- [ ] **Step 3: Add dashboard nav and layout**

Create `apps/web/components/dashboard/nav.tsx`:

```tsx
import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Domains", "/dashboard/domains"],
  ["Mailboxes", "/dashboard/mailboxes"],
  ["Aliases", "/dashboard/aliases"],
  ["Rules", "/dashboard/rules"],
  ["Logs", "/dashboard/logs"],
  ["Settings", "/dashboard/settings"]
] as const;

export function DashboardNav() {
  return (
    <nav className="flex flex-col gap-2">
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
          {label}
        </Link>
      ))}
    </nav>
  );
}
```

Create `apps/web/app/dashboard/layout.tsx`:

```tsx
import { logoutAction } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/nav";
import { requireOwner } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-800 bg-slate-950/95 p-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">SwanMail</p>
          <p className="mt-2 text-sm text-slate-400">{session.email}</p>
        </div>
        <DashboardNav />
        <form action={logoutAction} className="absolute bottom-6 left-6 right-6">
          <button className="w-full rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" type="submit">Sign out</button>
        </form>
      </aside>
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Add UI primitives**

Create `apps/web/components/ui/card.tsx`:

```tsx
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl ${className}`}>{children}</div>;
}
```

Create `apps/web/components/ui/button.tsx`:

```tsx
export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300 ${className}`} {...props}>{children}</button>;
}
```

Create `apps/web/components/ui/input.tsx`:

```tsx
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-500 focus:ring-2" {...props} />;
}
```

---

### Task 7: Add audit helper and tests

**Files:**
- Create: `apps/web/lib/audit.ts`
- Create: `apps/web/tests/audit.test.ts`

- [ ] **Step 1: Write audit helper test**

Create `apps/web/tests/audit.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createAuditLog } from "@/lib/audit";

describe("createAuditLog", () => {
  it("writes normalized audit log data", async () => {
    const prisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_1" })
      }
    };

    await createAuditLog(prisma as never, {
      actorUserId: "user_1",
      action: "alias.create",
      resourceType: "alias",
      resourceId: "alias_1",
      metadata: { address: "github@freakyswan.my.id" }
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "user_1",
        action: "alias.create",
        resourceType: "alias",
        resourceId: "alias_1",
        metadata: { address: "github@freakyswan.my.id" }
      }
    });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @swanmail/web test:run audit`

Expected: FAIL because `@/lib/audit` does not exist.

- [ ] **Step 3: Implement audit helper**

Create `apps/web/lib/audit.ts`:

```ts
import type { PrismaClient } from "@prisma/client";

type AuditInput = {
  actorUserId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export function createAuditLog(prisma: PrismaClient, input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata ?? {}
    }
  });
}
```

- [ ] **Step 4: Run audit test**

Run: `pnpm --filter @swanmail/web test:run audit`

Expected: PASS.

---

### Task 8: Add provider interfaces and mocks

**Files:**
- Create: `apps/web/lib/providers/types.ts`
- Create: `apps/web/lib/providers/mock.ts`

- [ ] **Step 1: Create provider types**

Create `apps/web/lib/providers/types.ts`:

```ts
export type CreateAliasInput = {
  address: string;
  destination?: string;
};

export type AliasResult = {
  id: string;
  address: string;
  status: "active" | "disabled";
};

export type DomainVerificationResult = {
  domain: string;
  status: "pending" | "verified" | "degraded";
  records: Array<{ type: string; name: string; value: string; valid: boolean }>;
};

export type SendEmailInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export type SendResult = {
  id: string;
  status: "queued" | "sent" | "failed";
};

export type EventQuery = {
  since?: Date;
  limit?: number;
};

export type EmailProviderEvent = {
  id: string;
  type: string;
  createdAt: Date;
};

export type DnsRecord = {
  type: string;
  name: string;
  value: string;
};

export interface EmailRoutingProvider {
  createAlias(input: CreateAliasInput): Promise<AliasResult>;
  disableAlias(aliasId: string): Promise<void>;
  listAliases(): Promise<AliasResult[]>;
  verifyDomain(domain: string): Promise<DomainVerificationResult>;
}

export interface EmailSendingProvider {
  sendEmail(input: SendEmailInput): Promise<SendResult>;
  verifySendingDomain(domain: string): Promise<DomainVerificationResult>;
  listEvents(input: EventQuery): Promise<EmailProviderEvent[]>;
}

export interface DnsProvider {
  getRecords(domain: string): Promise<DnsRecord[]>;
  verifyEmailRecords(domain: string): Promise<DomainVerificationResult>;
}
```

- [ ] **Step 2: Create mock providers**

Create `apps/web/lib/providers/mock.ts`:

```ts
import type {
  CreateAliasInput,
  DnsProvider,
  DomainVerificationResult,
  EmailRoutingProvider,
  EmailSendingProvider,
  EventQuery,
  SendEmailInput
} from "@/lib/providers/types";

function mockVerification(domain: string): DomainVerificationResult {
  return {
    domain,
    status: "pending",
    records: [
      { type: "MX", name: domain, value: "Cloudflare Email Routing", valid: false },
      { type: "TXT", name: domain, value: "SPF record not connected", valid: false },
      { type: "TXT", name: `_dmarc.${domain}`, value: "DMARC record not connected", valid: false }
    ]
  };
}

export class MockEmailRoutingProvider implements EmailRoutingProvider {
  async createAlias(input: CreateAliasInput) {
    return { id: `mock-${input.address}`, address: input.address, status: "active" as const };
  }

  async disableAlias() {}

  async listAliases() {
    return [];
  }

  async verifyDomain(domain: string) {
    return mockVerification(domain);
  }
}

export class MockEmailSendingProvider implements EmailSendingProvider {
  async sendEmail(input: SendEmailInput) {
    return { id: `mock-${input.from}-${input.to}`, status: "queued" as const };
  }

  async verifySendingDomain(domain: string) {
    return mockVerification(domain);
  }

  async listEvents(_input: EventQuery) {
    return [];
  }
}

export class MockDnsProvider implements DnsProvider {
  async getRecords() {
    return [];
  }

  async verifyEmailRecords(domain: string) {
    return mockVerification(domain);
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS after remaining pages/actions exist; if missing app pages, continue.

---

### Task 9: Add CRUD server actions

**Files:**
- Create: `apps/web/app/actions/mailboxes.ts`
- Create: `apps/web/app/actions/aliases.ts`
- Create: `apps/web/app/actions/routing-rules.ts`

- [ ] **Step 1: Create mailbox actions**

Create `apps/web/app/actions/mailboxes.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { buildAddress } from "@/lib/validation/email";
import { mailboxInputSchema } from "@/lib/validation/schemas";

export async function createMailboxAction(formData: FormData) {
  const session = await requireOwner();
  const input = mailboxInputSchema.parse({
    domainId: String(formData.get("domainId") ?? ""),
    localPart: String(formData.get("localPart") ?? ""),
    inboxDestination: String(formData.get("inboxDestination") ?? ""),
    sendEnabled: formData.get("sendEnabled") === "on",
    receiveEnabled: formData.get("receiveEnabled") !== "off",
    status: String(formData.get("status") ?? "active")
  });

  const domain = await prisma.domain.findUniqueOrThrow({ where: { id: input.domainId } });
  const mailbox = await prisma.mailbox.create({
    data: {
      domainId: input.domainId,
      localPart: input.localPart.toLowerCase(),
      address: buildAddress(input.localPart, domain.domain),
      inboxDestination: input.inboxDestination || null,
      sendEnabled: input.sendEnabled,
      receiveEnabled: input.receiveEnabled,
      status: input.status,
      ownerUserId: session.userId
    }
  });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "mailbox.create",
    resourceType: "mailbox",
    resourceId: mailbox.id,
    metadata: { address: mailbox.address }
  });

  revalidatePath("/dashboard/mailboxes");
}

export async function disableMailboxAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const mailbox = await prisma.mailbox.update({ where: { id }, data: { status: "disabled" } });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "mailbox.disable",
    resourceType: "mailbox",
    resourceId: mailbox.id,
    metadata: { address: mailbox.address }
  });

  revalidatePath("/dashboard/mailboxes");
}
```

- [ ] **Step 2: Create alias actions**

Create `apps/web/app/actions/aliases.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { buildAddress } from "@/lib/validation/email";
import { aliasInputSchema } from "@/lib/validation/schemas";

export async function createAliasAction(formData: FormData) {
  const session = await requireOwner();
  const input = aliasInputSchema.parse({
    domainId: String(formData.get("domainId") ?? ""),
    localPart: String(formData.get("localPart") ?? ""),
    destinationMailboxId: String(formData.get("destinationMailboxId") ?? ""),
    type: String(formData.get("type") ?? "custom"),
    status: String(formData.get("status") ?? "active"),
    expiresAt: String(formData.get("expiresAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    tags: String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean)
  });

  const domain = await prisma.domain.findUniqueOrThrow({ where: { id: input.domainId } });
  const alias = await prisma.alias.create({
    data: {
      domainId: input.domainId,
      localPart: input.localPart.toLowerCase(),
      address: buildAddress(input.localPart, domain.domain),
      destinationMailboxId: input.destinationMailboxId || null,
      type: input.type,
      status: input.status,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      notes: input.notes || null,
      tags: input.tags,
      createdById: session.userId
    }
  });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "alias.create",
    resourceType: "alias",
    resourceId: alias.id,
    metadata: { address: alias.address }
  });

  revalidatePath("/dashboard/aliases");
}

export async function disableAliasAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const alias = await prisma.alias.update({ where: { id }, data: { status: "disabled" } });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "alias.disable",
    resourceType: "alias",
    resourceId: alias.id,
    metadata: { address: alias.address }
  });

  revalidatePath("/dashboard/aliases");
}
```

- [ ] **Step 3: Create routing rule actions**

Create `apps/web/app/actions/routing-rules.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { routingRuleInputSchema } from "@/lib/validation/schemas";

export async function createRoutingRuleAction(formData: FormData) {
  const session = await requireOwner();
  const input = routingRuleInputSchema.parse({
    domainId: String(formData.get("domainId") ?? ""),
    aliasId: String(formData.get("aliasId") ?? ""),
    action: String(formData.get("action") ?? "forward"),
    conditionJson: String(formData.get("conditionJson") ?? "{}"),
    destinationJson: String(formData.get("destinationJson") ?? "{}"),
    priority: String(formData.get("priority") ?? "100"),
    enabled: formData.get("enabled") === "on"
  });

  const rule = await prisma.routingRule.create({
    data: {
      domainId: input.domainId,
      aliasId: input.aliasId || null,
      action: input.action,
      conditionJson: JSON.parse(input.conditionJson),
      destinationJson: JSON.parse(input.destinationJson),
      priority: input.priority,
      enabled: input.enabled
    }
  });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "routingRule.create",
    resourceType: "routingRule",
    resourceId: rule.id,
    metadata: { action: rule.action }
  });

  revalidatePath("/dashboard/rules");
}

export async function disableRoutingRuleAction(formData: FormData) {
  const session = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const rule = await prisma.routingRule.update({ where: { id }, data: { enabled: false } });

  await createAuditLog(prisma, {
    actorUserId: session.userId,
    action: "routingRule.disable",
    resourceType: "routingRule",
    resourceId: rule.id,
    metadata: { action: rule.action }
  });

  revalidatePath("/dashboard/rules");
}
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS after dashboard pages are added.

---

### Task 10: Add dashboard pages

**Files:**
- Create: `apps/web/app/dashboard/page.tsx`
- Create: `apps/web/app/dashboard/domains/page.tsx`
- Create: `apps/web/app/dashboard/mailboxes/page.tsx`
- Create: `apps/web/app/dashboard/aliases/page.tsx`
- Create: `apps/web/app/dashboard/rules/page.tsx`
- Create: `apps/web/app/dashboard/logs/page.tsx`
- Create: `apps/web/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Create dashboard summary page**

Create `apps/web/app/dashboard/page.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const [domains, mailboxes, aliases, events, auditLogs] = await Promise.all([
    prisma.domain.count(),
    prisma.mailbox.count(),
    prisma.alias.count(),
    prisma.emailEvent.count(),
    prisma.auditLog.count()
  ]);

  const stats = [
    ["Domains", domains],
    ["Mailboxes", mailboxes],
    ["Aliases", aliases],
    ["Email events", events],
    ["Audit logs", auditLogs]
  ] as const;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-slate-400">Hybrid email control plane foundation.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create domains page**

Create `apps/web/app/dashboard/domains/page.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

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
```

- [ ] **Step 3: Create mailboxes page**

Create `apps/web/app/dashboard/mailboxes/page.tsx`:

```tsx
import { createMailboxAction, disableMailboxAction } from "@/app/actions/mailboxes";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

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
```

- [ ] **Step 4: Create aliases page**

Create `apps/web/app/dashboard/aliases/page.tsx`:

```tsx
import { createAliasAction, disableAliasAction } from "@/app/actions/aliases";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

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
```

- [ ] **Step 5: Create rules page**

Create `apps/web/app/dashboard/rules/page.tsx`:

```tsx
import { createRoutingRuleAction, disableRoutingRuleAction } from "@/app/actions/routing-rules";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

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
```

- [ ] **Step 6: Create logs and settings pages**

Create `apps/web/app/dashboard/logs/page.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function LogsPage() {
  const [auditLogs, emailEvents] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.emailEvent.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Logs</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Audit logs</h2>
          <div className="mt-4 space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b border-slate-800 pb-3 text-sm">
                <p className="font-medium">{log.action}</p>
                <p className="text-slate-400">{log.resourceType ?? "system"} · {log.createdAt.toISOString()}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Email events</h2>
          <div className="mt-4 space-y-3">
            {emailEvents.map((event) => (
              <div key={event.id} className="border-b border-slate-800 pb-3 text-sm">
                <p className="font-medium">{event.eventType}</p>
                <p className="text-slate-400">{event.provider} · {event.createdAt.toISOString()}</p>
              </div>
            ))}
            {emailEvents.length === 0 ? <p className="text-sm text-slate-400">No provider events yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

Create `apps/web/app/dashboard/settings/page.tsx`:

```tsx
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="mt-8 grid gap-4">
        <Card>
          <h2 className="text-lg font-semibold">Provider status</h2>
          <p className="mt-2 text-sm text-slate-400">Cloudflare, Mailtrap, and DNS providers are not connected yet. This foundation uses mock provider boundaries only.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">AI privacy</h2>
          <p className="mt-2 text-sm text-slate-400">Email body access remains off by default. Metadata-only AI preferences are seeded for owner.</p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS.

---

### Task 11: Run full verification and update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Run verification commands**

Run commands:

```powershell
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

Expected: all pass. If `next lint` is unavailable in installed Next version, replace script with `eslint .` in `apps/web/package.json`, rerun `pnpm install`, then rerun `pnpm lint`.

- [ ] **Step 2: Verify smoke path manually**

Run:

```powershell
docker compose -f infra/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000/login`.

Expected:

1. Login succeeds with `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` from local `.env`.
2. Dashboard shows counts.
3. `/dashboard/aliases` can create a new alias.
4. `/dashboard/logs` shows `alias.create` audit log.

- [ ] **Step 3: Update CLAUDE.md commands section**

Replace current `## Current commands` section in `CLAUDE.md` with:

```md
## Current commands

Run from repository root unless noted.

- Install dependencies: `pnpm install`
- Start local database: `docker compose -f infra/docker-compose.yml up -d`
- Generate Prisma client: `pnpm db:generate`
- Run migrations: `pnpm db:migrate`
- Seed database: `pnpm db:seed`
- Start dev server: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Run tests once: `pnpm test:run`
- Run tests in watch mode: `pnpm test`
- Run one test file: `pnpm --filter @swanmail/web test:run tests/validation.test.ts`
- Build: `pnpm build`
```

- [ ] **Step 4: Final verification after docs update**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test:run
```

Expected: all pass.

---

## Self-review

Spec coverage:

- Next.js App Router + TypeScript + Tailwind: Tasks 1 and 6.
- PostgreSQL + Prisma + Docker Compose: Tasks 2 and 4.
- Owner-only auth: Task 5.
- Core schema/entities: Task 2.
- Seed data for `freakyswan.my.id`: Task 4.
- Dashboard shell/pages: Tasks 6 and 10.
- CRUD foundation for mailboxes, aliases, rules: Tasks 9 and 10.
- Audit logs: Tasks 7 and 9.
- Provider stubs/interfaces: Task 8.
- Tests/checks: Tasks 3, 7, and 11.
- CLAUDE.md command updates: Task 11.

Placeholder scan: no TBD/TODO/fill-later instructions remain.

Type consistency: Provider, schema, action, and page names use same identifiers across tasks.
