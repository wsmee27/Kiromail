# Kiromail / SwanMail — Improvement Roadmap

> **For agentic workers:** Gunakan file ini sebagai sumber kebenaran untuk pengembangan SwanMail setelah fondasi UI & auth selesai. Setiap fase punya checklist. Kerjakan fase secara berurutan kecuali ada catatan "dapat paralel". Setelah satu task selesai, centang checkbox-nya di PR yang sama.

**Context:** PRD `PRD_Email_Pribadi_FreakySwan_v2.md`, plan fondasi `2026-05-07-swanmail-core-app-foundation.md`, wizard domain `2026-05-07-domain-setup-wizard.md`, UI plan `2026-05-09-soft-premium-ui-ux-implementation.md`.

**Goal:** Menutup gap antara dashboard internal dan provider nyata (Cloudflare + Mailtrap), merapikan security/observability, menyeragamkan UI, dan menyiapkan pondasi operasional (backup, CI, health, rate limit) sehingga SwanMail bisa dipakai sebagai email pribadi harian + basis SaaS ke depan.

**Stack:** Next.js 15 App Router, TypeScript strict, Prisma + PostgreSQL 16, Tailwind v4, iron-session, Zod, Vitest, BullMQ + Redis (baru), Cloudflare Email Routing API, Mailtrap API.

---

## 0. Ringkasan perubahan (peta tingkat tinggi)

### Tambah
- `packages/email-providers` (Cloudflare, Mailtrap adapter nyata) + `packages/dns`.
- Tabel `ProviderCredential`, `Invite`, `RateLimitBucket`, `BackupJob`.
- Kolom sinkronisasi provider di `Domain`, `Mailbox`, `Alias`, `RoutingRule` (`externalId`, `providerSyncedAt`, `lastSyncError`).
- Endpoint webhook `/api/webhooks/mailtrap` dan `/api/webhooks/cloudflare` (signature check).
- Endpoint `/api/health`, `/api/backups/export`.
- Redis (+ BullMQ worker) di `infra/docker-compose.yml`.
- `Dockerfile` untuk `apps/web` dan CI GitHub Actions (lint, typecheck, test, prisma validate).
- Halaman dashboard baru: **Domain Setup Wizard** (verify DNS), **Send-as Guide (Gmail)**, **Backups**, **Team / Invites** (opsional).
- Service layer `apps/web/lib/services/*` memisahkan business logic dari server actions.
- Logger terstruktur `lib/logger.ts`, optional Sentry.
- README.md root.

### Perbaiki / Upgrade
- `.env.example` dilengkapi seluruh secret yang dipakai runtime + validasi `env.ts`.
- Semua server actions refactor ke pola `useActionState` dengan return `{ ok, error }`.
- Rate limit untuk login stage 1 (password), login stage 2 (TOTP sudah ada lockout), dan action CRUD.
- Menyeragamkan semua halaman dashboard ke design system soft-premium (`PageHeader`, `SectionCard`, `EmptyState`, `StatusBadge`, `StatCard`).
- Logs page: filter tanggal/tipe event/alias/mailbox + paginasi.
- Routing rule: Zod discriminated union untuk `conditionJson`/`destinationJson` (buang `JSON.parse` mentah).
- Index DB pada `EmailEvent.createdAt`, `EmailEvent.messageId`, `EmailEvent.aliasId`, `EmailEvent.mailboxId`, `AuditLog.createdAt`, `AuditLog.actorUserId`.
- Seed: idempotent, tidak memaksa ulang password jika owner sudah ada.
- Validasi kepemilikan `domainId`/`mailboxId` lintas action (scope check owner).

### Hapus / Deprecate
- `MockDnsProvider`, `MockEmailRoutingProvider`, `MockEmailSendingProvider` **dihapus dari jalur produksi** — tetap dipertahankan sebagai `*.mock.ts` khusus test (`NODE_ENV=test`), bukan fallback runtime.
- `JSON.parse` langsung di `createRoutingRuleAction` → dihapus, diganti Zod.
- Field bebas `Domain.provider: String` → diganti enum `DomainProvider`.
- Gaya lama tanpa `PageHeader` di `mailboxes`, `aliases`, `rules`, `logs`, `settings` → dihapus dan digantikan primitif soft-premium.

### Ubah alur
1. **Create mailbox / alias / routing rule** → sekarang lewat service layer yang memanggil Cloudflare adapter di dalam transaksi Prisma. DB commit hanya jika provider sukses.
2. **Inbound event** → Cloudflare Email Routing drop → Mailtrap delivery → webhook SwanMail → `EmailEvent` row.
3. **Outbound** → Gmail "Send as" via SMTP Mailtrap credential → webhook SwanMail → `EmailEvent`.
4. **Domain verify** → user klik "Verify" → `DnsProvider.verifyEmailRecords(domain)` → status badge per record (MX, SPF, DKIM, DMARC) + disimpan ke `Domain.dnsStatus`.
5. **Nightly reconcile** (BullMQ cron) → bandingkan DB vs Cloudflare, tulis `lastSyncError` jika drift.
6. **Backup export** → BullMQ job → JSON dump users/domains/mailboxes/aliases/routing_rules + CSV alias → hasil tersimpan `BackupJob.resultUrl` / download langsung.

---

## 1. Arsitektur target (diagram teks)

```
                          ┌──────────────────────────────────────────┐
                          │   Browser (owner) → iron-session cookie  │
                          └──────────────────────────────────────────┘
                                         │
                                         ▼
 ┌────────────────────────── apps/web (Next.js App Router) ─────────────────────────┐
 │                                                                                  │
 │  Pages (server components)  ──►  Server Actions (useActionState {ok,error})     │
 │                                                                                  │
 │                                       │                                          │
 │                                       ▼                                          │
 │                           lib/services/ (business logic)                         │
 │                              ├── mailbox.service                                 │
 │                              ├── alias.service                                   │
 │                              ├── routing.service                                 │
 │                              ├── domain.service                                  │
 │                              ├── credential.service (AES-256-GCM)                │
 │                              └── ratelimit.service                               │
 │                                       │                                          │
 │              ┌────────────────────────┼────────────────────────┐                 │
 │              ▼                        ▼                        ▼                 │
 │        Prisma + Postgres    packages/email-providers   packages/dns              │
 │        (transactional)          (Cloudflare, Mailtrap)   (Cloudflare DNS)        │
 │                                       │                                          │
 │                                       ▼                                          │
 │                              External APIs                                       │
 └──────────────────────────────────────────────────────────────────────────────────┘

 ┌── apps/worker (BullMQ) ──┐   ┌── Redis ──┐   ┌── Postgres 16 ──┐
 │ reconcile, backups,      │◄──│  queues   │──►│ primary DB       │
 │ alias expiry, ai digest  │   └───────────┘   └──────────────────┘
 └──────────────────────────┘

 ┌── Webhooks ─────────────────────────────────────────────────────┐
 │ POST /api/webhooks/mailtrap   (HMAC signature)                  │
 │ POST /api/webhooks/cloudflare (signed secret)                   │
 └─────────────────────────────────────────────────────────────────┘
```

---

## 2. File structure yang dituju

Create:
- `apps/web/lib/env.ts`
- `apps/web/lib/logger.ts`
- `apps/web/lib/services/mailbox.ts`
- `apps/web/lib/services/alias.ts`
- `apps/web/lib/services/routing.ts`
- `apps/web/lib/services/domain.ts`
- `apps/web/lib/services/credential.ts`
- `apps/web/lib/services/ratelimit.ts`
- `apps/web/lib/services/backup.ts`
- `apps/web/lib/services/invite.ts`
- `apps/web/lib/validation/routing.ts`
- `apps/web/app/api/health/route.ts`
- `apps/web/app/api/webhooks/mailtrap/route.ts`
- `apps/web/app/api/webhooks/cloudflare/route.ts`
- `apps/web/app/api/backups/export/route.ts`
- `apps/web/app/dashboard/domains/[id]/page.tsx` (wizard detail)
- `apps/web/app/dashboard/send-as/page.tsx`
- `apps/web/app/dashboard/backups/page.tsx`
- `apps/web/app/dashboard/team/page.tsx` (opsional Sprint 4)
- `apps/web/app/invite/[token]/page.tsx` (opsional Sprint 4)
- `packages/email-providers/package.json`
- `packages/email-providers/src/index.ts`
- `packages/email-providers/src/cloudflare/email-routing.ts`
- `packages/email-providers/src/mailtrap/sending.ts`
- `packages/email-providers/src/types.ts`
- `packages/dns/package.json`
- `packages/dns/src/index.ts`
- `packages/dns/src/cloudflare-dns.ts`
- `apps/worker/package.json`
- `apps/worker/src/index.ts`
- `apps/worker/src/jobs/reconcile.ts`
- `apps/worker/src/jobs/alias-expiry.ts`
- `apps/worker/src/jobs/backup.ts`
- `apps/worker/src/jobs/ai-digest.ts`
- `apps/web/Dockerfile`
- `apps/worker/Dockerfile`
- `.github/workflows/ci.yml`
- `README.md`
- `docs/dns-setup.md`
- `docs/gmail-send-as.md`
- `docs/security.md`

Modify:
- `.env.example`
- `infra/docker-compose.yml` (tambah redis, worker, caddy opsional)
- `apps/web/prisma/schema.prisma` (index + kolom sync + enum + tabel baru)
- `apps/web/prisma/seed.ts` (idempotent)
- `apps/web/lib/validation/schemas.ts`
- `apps/web/lib/providers/types.ts` → pindah ke `packages/email-providers/src/types.ts`
- `apps/web/app/actions/auth.ts` (rate limit stage 1)
- `apps/web/app/actions/mailboxes.ts` (service layer + {ok,error})
- `apps/web/app/actions/aliases.ts` (service layer + {ok,error})
- `apps/web/app/actions/routing-rules.ts` (Zod discriminated, service)
- `apps/web/app/dashboard/mailboxes/page.tsx` (soft-premium)
- `apps/web/app/dashboard/aliases/page.tsx` (soft-premium)
- `apps/web/app/dashboard/rules/page.tsx` (soft-premium)
- `apps/web/app/dashboard/logs/page.tsx` (filter + paginasi)
- `apps/web/app/dashboard/settings/page.tsx` (kartu provider/credential/backup)
- `apps/web/app/dashboard/domains/page.tsx` (tombol Verify + form Add)
- `docs/IMPLEMENTATION_PLAN.md` (link ke plan ini)

Delete (pindah / deprecate):
- `apps/web/lib/providers/mock.ts` → `apps/web/lib/providers/__mocks__/mock.ts` khusus test
- Bagian `JSON.parse(input.conditionJson)` di `app/actions/routing-rules.ts`
- Kolom lama `Domain.provider String` (diganti enum via migration)

---

## 3. Fase eksekusi

Pengerjaan dibagi 5 sprint. Tiap sprint punya exit criteria. **Jangan lompat sprint** kecuali ada alasan tertulis di PR description.

---

### Sprint 1 — Hardening fondasi & konsistensi UI (est. 1–2 minggu)

**Goal:** Hilangkan gap keamanan dasar, seragamkan UI, kuatkan error handling, tambah observability minimum. Tanpa ini, membangun integrasi Cloudflare/Mailtrap di atasnya rawan regresi.

**Files:**
- Create: `apps/web/lib/env.ts`, `apps/web/lib/logger.ts`, `apps/web/lib/services/ratelimit.ts`, `apps/web/lib/validation/routing.ts`, `apps/web/app/api/health/route.ts`, `README.md`
- Modify: `.env.example`, `apps/web/prisma/schema.prisma`, `apps/web/app/actions/auth.ts`, `apps/web/app/actions/mailboxes.ts`, `apps/web/app/actions/aliases.ts`, `apps/web/app/actions/routing-rules.ts`, `apps/web/app/dashboard/{mailboxes,aliases,rules,logs,settings,domains}/page.tsx`, `apps/web/app/dashboard/layout.tsx`, `apps/web/lib/auth/session.ts`, `apps/web/prisma/seed.ts`, `docs/IMPLEMENTATION_PLAN.md`
- Test: `apps/web/tests/env.test.ts`, `apps/web/tests/ratelimit.test.ts`, `apps/web/tests/actions-mailbox.test.ts`, `apps/web/tests/actions-alias.test.ts`, `apps/web/tests/actions-routing.test.ts`

**Tasks:**

- [ ] **1.1 Tambah `lib/env.ts` + validasi runtime**
  - Zod schema untuk `DATABASE_URL`, `SESSION_PASSWORD` (min 32), `APP_ENCRYPTION_KEY` (wajib), `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_SECRET`, `MAILTRAP_API_TOKEN`, `MAILTRAP_WEBHOOK_SECRET`, `REDIS_URL`, `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `LOG_LEVEL`.
  - Import di `lib/db.ts`, `lib/auth/session.ts`, `lib/auth/secrets.ts`, semua action.
  - Gagal import → throw dengan pesan jelas daftar var yang hilang.

- [ ] **1.2 `.env.example` lengkap + dokumentasi inline**
  - Tambahkan semua key di 1.1 dengan komentar singkat.
  - Contoh: `APP_ENCRYPTION_KEY=generate_with_openssl_rand_base64_32`.

- [ ] **1.3 `lib/logger.ts`** wrapper sederhana (level, requestId, jsonLine di prod). Pakai `pino` jika dependency ringan, atau hand-rolled `console.log(JSON.stringify(...))`.

- [ ] **1.4 `lib/services/ratelimit.ts`**
  - Fixed-window counter via Postgres table `RateLimitBucket(key, windowStart, count)` + unique key.
  - API: `consume(key, limit, windowSec): Promise<{ ok, remaining, resetAt }>`.
  - Pakai di `loginAction` (key `login:<email>:<ip>`, limit 10/menit) dan semua CRUD action (limit 60/menit per user).

- [ ] **1.5 Prisma schema hardening**
  - Tambah enum `DomainProvider { cloudflare, mailtrap, custom }`, ubah `Domain.provider` menjadi enum.
  - Tambah index:
    - `EmailEvent`: `@@index([createdAt])`, `@@index([messageId])`, `@@index([aliasId])`, `@@index([mailboxId])`.
    - `AuditLog`: `@@index([createdAt])`, `@@index([actorUserId])`.
  - Tambah kolom `externalId String? @unique`, `providerSyncedAt DateTime?`, `lastSyncError String?` pada `Domain`, `Mailbox`, `Alias`, `RoutingRule`.
  - Tambah model `RateLimitBucket`.
  - Generate migration `20260510_hardening`.

- [ ] **1.6 Validasi routing rule**
  - Buat `lib/validation/routing.ts` dengan `conditionSchema = z.discriminatedUnion("type", [...])` (mis. `header`, `recipient`, `catch_all`), `destinationSchema` (mis. `forward`, `drop`, `quarantine`).
  - Ganti `JSON.parse(input.conditionJson)` di action dengan schema ini.

- [ ] **1.7 Pola `{ ok, error }` + `useActionState`**
  - Ubah return semua server action ke `ActionResult<T>`.
  - Form di page pakai `useActionState` dan render banner error merah + success toast.

- [ ] **1.8 Scope check owner**
  - Tambah helper `assertDomainOwnedBy(userId, domainId)` dan `assertMailboxOwnedBy(userId, mailboxId)` di service.
  - Pakai di semua action create/update/delete.

- [ ] **1.9 Seragamkan UI**
  - `/dashboard/mailboxes`, `/aliases`, `/rules`, `/logs`, `/settings` wajib pakai `PageHeader`, `SectionCard`, `EmptyState`, `StatusBadge`, sesuai `2026-05-09-soft-premium-ui-ux-implementation.md`.
  - Hapus `<h1 className="text-3xl font-semibold">` yang tersisa.

- [ ] **1.10 `/api/health`**
  - `GET` kembalikan `{ status: "ok"|"degraded", db: true/false, env: true/false, version }`.
  - 200 jika semua OK, 503 jika degraded. Dipakai untuk healthcheck container.

- [ ] **1.11 `README.md` root**
  - Sections: Overview, Requirements, `.env`, Dev run (`docker compose up db redis && pnpm dev`), Test, Architecture diagram, Link ke PRD & plan ini, Security notes.

- [ ] **1.12 Update `docs/IMPLEMENTATION_PLAN.md`**
  - Tandai Phase 4 selesai.
  - Tautkan ke plan ini sebagai sumber kebenaran Phase 5+.

**Exit criteria:**
- `pnpm -r test` hijau.
- `curl /api/health` memberikan 200.
- UI semua halaman dashboard konsisten (soft-premium).
- Dev baru bisa `git clone` → `cp .env.example .env` → `pnpm dev` → login tanpa kebingungan missing key.

---

### Sprint 2 — Integrasi Cloudflare (inbound + DNS) (est. 2–3 minggu)

**Goal:** Membuat `Domain`, `Mailbox`, `Alias` benar-benar hidup di Cloudflare Email Routing. Dashboard bukan lagi CRUD metadata lokal.

**Files:**
- Create: `packages/email-providers/*`, `packages/dns/*`, `apps/web/lib/services/{domain,mailbox,alias,routing,credential}.ts`, `apps/web/app/dashboard/domains/[id]/page.tsx`
- Modify: `apps/web/app/actions/{mailboxes,aliases,routing-rules}.ts`, `apps/web/app/dashboard/domains/page.tsx`, `apps/web/app/dashboard/settings/page.tsx`, `apps/web/prisma/schema.prisma` (tabel `ProviderCredential`)
- Test: `packages/email-providers/tests/cloudflare.test.ts` (mock fetch), `apps/web/tests/services-domain.test.ts`

**Tasks:**

- [ ] **2.1 Scaffold `packages/email-providers` & `packages/dns`**
  - TypeScript project refs, pnpm workspace, build ke `dist`.
  - `EmailRoutingProvider`, `EmailSendingProvider`, `DnsProvider` pindah ke `packages/email-providers/src/types.ts`.

- [ ] **2.2 Tabel `ProviderCredential`**
  - `id, kind (cloudflare|mailtrap), label, ciphertext (String), maskedHint (String), createdAt, lastUsedAt`.
  - `credential.service.ts` meng-encrypt pakai `encryptSecret()` yang sudah ada.
  - UI settings: form tambah credential (Cloudflare API token), setelah simpan hanya tampilkan masked `abcd…xyz`.

- [ ] **2.3 `CloudflareEmailRoutingProvider`**
  - API: `https://api.cloudflare.com/client/v4/zones/{zone}/email/routing/...`.
  - Implementasi: `listDestinationAddresses`, `createDestinationAddress`, `listRules`, `createRule`, `deleteRule`, `enableEmailRouting`.
  - Retry exponential (max 3), timeout 10s, log `requestId` ke logger.

- [ ] **2.4 `CloudflareDnsProvider`**
  - Baca record MX, TXT SPF, TXT DMARC, CNAME/TXT DKIM.
  - `verifyEmailRecords(domain) → { mx, spf, dkim, dmarc, hasEmailRouting }` dengan status `ok|warn|missing`.

- [ ] **2.5 Service layer + transaksi**
  - `mailbox.service.create(input)`:
    1. Ratelimit,
    2. Scope check domain,
    3. `prisma.$transaction(async tx => { mailbox = tx.mailbox.create(...); externalId = await provider.createDestinationAddress(...); tx.mailbox.update({ externalId, providerSyncedAt }); })`,
    4. `createAuditLog("mailbox.create", ...)`.
  - `alias.service.create(input)`: idem tapi panggil `createRule`.
  - `routing.service.create(input)`: idem.
  - Jika provider gagal → rollback transaksi, tulis `lastSyncError`, return `{ ok: false, error }`.

- [ ] **2.6 Domain "Add" form + Verify flow**
  - `/dashboard/domains` sekarang menerima form `{ name, provider }` (create domain).
  - Tombol "Verify DNS" per-domain → panggil `dns.service.verify(domainId)` → update `Domain.dnsStatus`.
  - Halaman detail `/dashboard/domains/[id]/page.tsx`:
    - 4 status badge (MX, SPF, DKIM, DMARC), contoh record yang harus ditambahkan (copy button), petunjuk Cloudflare.
    - Tombol "Enable Email Routing" → panggil `enableEmailRouting` di Cloudflare.

- [ ] **2.7 Reconcile on-demand**
  - Di settings, tombol "Reconcile Cloudflare" memanggil service yang list semua rules Cloudflare vs Alias di DB, lalu tulis `lastSyncError = "missing on cloudflare"` atau `"orphan rule"`.

- [ ] **2.8 Hapus jalur mock dari produksi**
  - `lib/providers/mock.ts` pindah ke `__mocks__` dan dipakai hanya saat `NODE_ENV=test`.
  - Factory `getEmailRoutingProvider()` lempar error kalau `CLOUDFLARE_API_TOKEN` tidak ada di `NODE_ENV=production`.

**Exit criteria:**
- Owner bisa tambah domain, klik Verify, melihat 4 badge DNS real.
- Membuat mailbox/alias di dashboard menghasilkan rule baru di Cloudflare (diverifikasi manual sekali).
- Menghapus alias menghapus rule Cloudflare.
- Drift dashboard vs Cloudflare bisa ditampilkan lewat Reconcile.

---

### Sprint 3 — Outbound (Mailtrap) + observability end-to-end (est. 2 minggu)

**Goal:** User bisa kirim email "atas nama alias" dari Gmail pakai SMTP Mailtrap, dan setiap event (delivered, bounce, spam) muncul di `/logs` real-time.

**Files:**
- Create: `packages/email-providers/src/mailtrap/sending.ts`, `apps/web/app/api/webhooks/mailtrap/route.ts`, `apps/web/app/api/webhooks/cloudflare/route.ts`, `apps/web/app/dashboard/send-as/page.tsx`, `docs/gmail-send-as.md`, `apps/web/lib/services/event-ingest.ts`
- Modify: `apps/web/app/dashboard/logs/page.tsx`, `apps/web/app/dashboard/settings/page.tsx`
- Test: `apps/web/tests/webhook-mailtrap.test.ts`, `apps/web/tests/event-ingest.test.ts`

**Tasks:**

- [ ] **3.1 `MailtrapSendingProvider`**
  - `verifySendingDomain(domain)`, `getSmtpCredentials(mailboxId)` (generate satu kali dan simpan hanya hash + hint).
  - Endpoint POST event ingestion (untuk test manual).

- [ ] **3.2 Send-as UI (`/dashboard/send-as`)**
  - Pilih mailbox → tampilkan host, port, username, **password sekali** di modal + instruksi Gmail.
  - Password tidak bisa dilihat kembali; bisa re-generate (revoke lama).

- [ ] **3.3 Webhook Mailtrap**
  - Route handler verifikasi header `X-Mailtrap-Signature` (HMAC SHA256 dengan `MAILTRAP_WEBHOOK_SECRET`).
  - Parse payload → map ke `EmailEvent` (`type: delivered|bounce|spam|soft_bounce|rejected`, `messageId`, `toAddress`, `fromAddress`, `meta`).
  - Reject replay >5 menit lewat `timestamp`.

- [ ] **3.4 Webhook Cloudflare (opsional)**
  - Jika Cloudflare Worker di depan pakai signed request, validasi lalu simpan sebagai `type: routed|dropped`.

- [ ] **3.5 Logs page upgrade**
  - Filter: `type`, `mailbox`, `alias`, date range (default 7 hari), full-text on `meta.subject`.
  - Paginasi cursor-based pakai `createdAt+id`.
  - Export CSV tombol.

- [ ] **3.6 `docs/gmail-send-as.md`**
  - Walk-through (Gmail → Settings → Accounts and Import → Add another email). Harus sejalan dengan halaman Send-as UI.

**Exit criteria:**
- Kirim email dari Gmail pakai alias `hello@swanmail.io` → masuk Mailtrap → webhook → row `EmailEvent` type=`delivered` tampil di `/logs` dalam <5 detik.
- Bounce test (alamat tidak ada) menghasilkan row type=`bounce`.

---

### Sprint 4 — Worker, backup, invite, catch-all (est. 2 minggu)

**Goal:** Siapkan operasional jangka panjang: worker async, backup JSON/CSV, quarantine sederhana, invite anggota keluarga/tim.

**Files:**
- Create: `apps/worker/*`, `apps/web/app/api/backups/export/route.ts`, `apps/web/app/dashboard/backups/page.tsx`, `apps/web/app/dashboard/team/page.tsx`, `apps/web/app/invite/[token]/page.tsx`, `apps/web/lib/services/{backup,invite}.ts`
- Modify: `infra/docker-compose.yml` (tambah service `redis` & `worker`), `apps/web/prisma/schema.prisma` (tambah `Invite`, `BackupJob`, `Quarantine`)

**Tasks:**

- [ ] **4.1 Redis + BullMQ**
  - Tambah service `redis:7` di docker-compose.
  - `apps/worker` pakai BullMQ, share Prisma client via `packages/db` (ekstrak dari `apps/web/lib/db.ts`).

- [ ] **4.2 Cron jobs**
  - `reconcile-cloudflare` @ 04:00 UTC.
  - `alias-expiry` @ tiap jam (nonaktifkan alias yang lewat `expiresAt`).
  - `backup-daily` @ 02:00 UTC, menghasilkan zip JSON+CSV ke storage lokal / S3 kompatibel (MinIO di docker-compose).
  - `ai-digest` @ 07:00 lokal user (respect `AiPreference`).

- [ ] **4.3 Backup UI**
  - `/dashboard/backups` list job sebelumnya + tombol "Run now".
  - Download link protected oleh session.
  - Retention 30 hari default, dihapus otomatis oleh job.

- [ ] **4.4 Invite flow**
  - Tabel `Invite(id, email, role, token, expiresAt, acceptedAt)`.
  - `/dashboard/team` untuk owner mengundang, `/invite/[token]` untuk accept (set password + 2FA).

- [ ] **4.5 Catch-all quarantine**
  - Jika alias `catch_all` aktif, webhook Cloudflare mencocokkan tujuan `*@domain`. Simpan payload di `Quarantine` (retensi 14 hari) dan UI sederhana untuk release/discard.

**Exit criteria:**
- Worker service jalan di docker-compose, logs bersih.
- Backup terbentuk otomatis, bisa didownload owner.
- Owner bisa undang user kedua lewat email (mock SMTP → Mailtrap), user accept & bisa login dengan 2FA.
- Catch-all UI bisa me-release email ke mailbox utama.

---

### Sprint 5 — CI, containerization, deploy (est. 1 minggu) + growth (opsional)

**Goal:** Production-ready.

- [ ] **5.1 `apps/web/Dockerfile`** multi-stage (pnpm install → prisma generate → next build → runtime).
- [ ] **5.2 `apps/worker/Dockerfile`** multi-stage.
- [ ] **5.3 `.github/workflows/ci.yml`**
  - Jobs: `lint`, `typecheck`, `prisma-validate`, `test`, `build` (cache pnpm).
  - Wajib hijau sebelum merge ke `main`.
- [ ] **5.4 `docs/security.md`** checklist: encryption, rotation, backups, audit, 2FA, rate limit.
- [ ] **5.5 Optional Sentry** hook di `logger.ts`.
- [ ] **5.6 Optional observability stack** (Caddy + Prometheus + Grafana) di `infra/docker-compose.prod.yml`.

**Exit criteria:**
- `gh pr checks` hijau penuh.
- Image Docker berjalan di VPS dengan healthcheck `/api/health`.
- Runbook singkat di `docs/security.md`.

---

## 4. Alur integrasi kunci (happy path)

### 4.1 Onboarding domain
1. Owner buka `/dashboard/domains` → klik **Add domain**, isi `swanmail.io`.
2. SwanMail simpan row `Domain(status=pending)`.
3. Halaman detail domain menampilkan 4 record yang harus di-paste ke DNS (MX, SPF, DKIM, DMARC).
4. Owner klik **Verify** → `CloudflareDnsProvider.verifyEmailRecords()` → update badge.
5. Saat semua hijau, tombol **Enable Email Routing** aktif → panggil Cloudflare → status domain `active`.

### 4.2 Buat mailbox
1. Owner pilih domain aktif → form **New mailbox** (local part `hello`, display name).
2. Action validasi → `mailbox.service.create` → transaksi:
   - `tx.mailbox.create`,
   - `CloudflareEmailRoutingProvider.createDestinationAddress("hello@swanmail.io")`,
   - `MailtrapSendingProvider.provisionMailbox(...)` → dapat SMTP cred,
   - simpan `externalId`, `providerSyncedAt`, audit log.
3. UI menampilkan SMTP cred **sekali** + link "Set up in Gmail" → `/dashboard/send-as?mailboxId=...`.

### 4.3 Kirim email dari Gmail
1. Owner ikuti `docs/gmail-send-as.md` di Gmail.
2. Gmail kirim via SMTP Mailtrap dengan user alias.
3. Mailtrap → webhook SwanMail → row `EmailEvent(type=delivered)` → muncul di `/dashboard/logs`.

### 4.4 Terima email
1. Pengirim mengirim ke `hello@swanmail.io`.
2. Cloudflare Email Routing match rule → forward ke Gmail owner.
3. Cloudflare webhook (jika aktif) → `EmailEvent(type=routed)`.

### 4.5 Nightly reconcile
1. BullMQ cron panggil `reconcile-cloudflare`.
2. Bandingkan `alias` DB dengan rules Cloudflare.
3. Drift → tulis `lastSyncError`, muncul badge "Needs attention" di UI alias.

### 4.6 Backup harian
1. Cron `backup-daily` bangunkan worker.
2. Dump seluruh tabel metadata (non-secret) ke JSON + CSV alias.
3. Upload ke bucket lokal (MinIO) / S3. URL disimpan `BackupJob.resultUrl`.
4. Owner bisa download dari `/dashboard/backups`.

---

## 5. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Cloudflare rate limit / timeout | Create mailbox gagal, state DB bersih karena rollback | Retry exponential + queue fallback; UI tampilkan "Try again" |
| Secret bocor dari dump Postgres | Credential Mailtrap bocor | Simpan hanya hash + hint; password SMTP tidak di DB melainkan di Mailtrap |
| Lockout owner akibat 2FA hilang | Owner tidak bisa login | CLI script `pnpm --filter @swanmail/web exec tsx prisma/scripts/reset-2fa.ts` untuk server admin |
| Worker lag | Reconcile/bounce telat | Monitor queue depth via `/api/health` extended; alarm threshold |
| Data drift setelah outage Cloudflare | Dashboard menampilkan alias aktif padahal di Cloudflare hilang | Reconcile harian + banner "Last synced N jam lalu" di UI |
| Migrasi breaking di Prisma | Downtime | Gunakan shadow DB di CI + `prisma migrate diff` di PR |

---

## 6. Metrik sukses

- **Functional:** ≥95% operasi CRUD dashboard tercermin di Cloudflare dalam <3 detik.
- **Reliability:** Backup harian sukses 30 hari berturut-turut.
- **Security:** 100% secret provider tersimpan terenkripsi; CI memblokir PR yang meng-commit plaintext token.
- **Ops:** MTTR login bug <24 jam berkat audit log + logger.
- **UX:** Semua halaman dashboard memakai design system soft-premium (grep tidak menemukan pola lama).

---

## 7. Follow-up di luar scope

- Multi-tenant / workspaces (SaaS).
- Newsletter stream di subdomain terpisah sesuai PRD §16.2.
- Stalwart self-host lab (Phase 2 PRD).
- AI full — klasifikasi konten, triage otomatis.
- Mobile app shell (PWA).

Simpan ide-ide ini sebagai plan baru saat sprint 1–5 sudah mendarat.
