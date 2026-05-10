# Apps Web Review Map

Dokumen ini merangkum area `apps/web` untuk review cepat. Fokus pada source, test, dan config penting. File generated seperti `.next` dan dependency tree seperti `node_modules` dikecualikan.

## 1. Overview `apps/web`

`apps/web` adalah aplikasi Next.js App Router untuk MVP SwanMail. Area ini mencakup:

- halaman login owner dan challenge 2FA
- dashboard owner untuk domains, mailboxes, aliases, routing rules, logs, dan settings
- server actions untuk mutasi data utama
- library auth, audit, validation, provider boundary, dan akses Prisma
- seed database dan test unit dasar

Arsitektur umum:

- **UI layer**: `app/**` dan `components/**`
- **mutation layer**: `app/actions/**`
- **domain/service helpers**: `lib/**`
- **persistence**: Prisma lewat `lib/db.ts`
- **verification**: `tests/**`

## 2. Route Map

| Route | File | Peran |
| --- | --- | --- |
| `/` | `apps/web/app/page.tsx` | Redirect langsung ke dashboard |
| `/login` | `apps/web/app/login/page.tsx` | Form login owner |
| `/login/2fa` | `apps/web/app/login/2fa/page.tsx` | Form verifikasi TOTP |
| `/dashboard` | `apps/web/app/dashboard/page.tsx` | Ringkasan metrik dan domain butuh perhatian |
| `/dashboard/domains` | `apps/web/app/dashboard/domains/page.tsx` | Status domain dan DNS health placeholder |
| `/dashboard/mailboxes` | `apps/web/app/dashboard/mailboxes/page.tsx` | CRUD ringan mailbox |
| `/dashboard/aliases` | `apps/web/app/dashboard/aliases/page.tsx` | CRUD ringan alias |
| `/dashboard/rules` | `apps/web/app/dashboard/rules/page.tsx` | CRUD ringan routing rule |
| `/dashboard/logs` | `apps/web/app/dashboard/logs/page.tsx` | Audit logs dan email event log |
| `/dashboard/settings` | `apps/web/app/dashboard/settings/page.tsx` | Status provider mock dan AI privacy copy |

## 3. Server Actions Map

| Action file | Tanggung jawab |
| --- | --- |
| `app/actions/auth.ts` | login, pending 2FA session, verify 2FA, logout |
| `app/actions/mailboxes.ts` | create mailbox, disable mailbox |
| `app/actions/aliases.ts` | create alias, disable alias |
| `app/actions/routing-rules.ts` | create rule, disable rule |

Pola umum server action:

1. validasi/form parsing
2. otorisasi owner bila perlu
3. baca/tulis Prisma
4. tulis audit log
5. refresh tampilan via `revalidatePath()` atau `redirect()`

## 4. UI Components Map

### Dashboard shell
- `components/dashboard/nav.tsx` — nav client-side, pakai `usePathname()` untuk active state

### UI primitives
- `components/ui/button.tsx` — tombol utama konsisten
- `components/ui/input.tsx` — input styling konsisten
- `components/ui/card.tsx` — container dasar
- `components/ui/page-header.tsx` — header halaman dashboard
- `components/ui/stat-card.tsx` — kartu metrik
- `components/ui/status-badge.tsx` — badge status berbasis semantic token string
- `components/ui/section-card.tsx` — section wrapper dengan title/description/action opsional
- `components/ui/empty-state.tsx` — state kosong reusable

## 5. Library Map

### Auth and session
- `lib/auth/password.ts` — hashing dan verify password via bcrypt
- `lib/auth/secrets.ts` — enkripsi secret sensitif dengan AES-256-GCM
- `lib/auth/session.ts` — iron-session wrapper dan guard `requireOwner()`
- `lib/auth/two-factor.ts` — aturan lockout, gate, verifikasi TOTP

### Data and persistence
- `lib/db.ts` — singleton Prisma client pakai `@prisma/adapter-pg`
- `lib/audit.ts` — helper normalisasi create audit log

### Validation
- `lib/validation/email.ts` — validasi local-part dan normalisasi alamat
- `lib/validation/schemas.ts` — schema Zod untuk mailbox, alias, routing rule

### Provider boundary
- `lib/providers/types.ts` — interface boundary untuk routing, sending, DNS provider
- `lib/providers/mock.ts` — mock implementation sementara untuk boundary itu

## 6. Test Coverage Map

| Test file | Cakupan |
| --- | --- |
| `tests/audit.test.ts` | shape audit log write |
| `tests/auth-2fa.test.ts` | gate enable/disable 2FA |
| `tests/password.test.ts` | hash + verify password |
| `tests/secrets.test.ts` | encrypt/decrypt secret dan safe failure |
| `tests/session.test.ts` | env requirement session dan owner gate predicate |
| `tests/two-factor.test.ts` | valid/invalid TOTP dan lockout helper |
| `tests/validation.test.ts` | email local-part, address build, Zod schemas |
| `tests/ui-components.test.ts` | render primitive UI penting |

Coverage saat ini dominan di helper dan primitive, belum di page behavior atau server action end-to-end.

## 7. Config and Runtime Map

- `package.json` — scripts dev/build/lint/typecheck/test/db
- `next.config.ts` — config Next masih kosong
- `tailwind.config.ts` — content scan `app/components/lib`, custom color `ink`
- `vitest.config.ts` — node env, globals, alias `@`
- `tsconfig.json` — strict TS, alias `@/*`, include `.next/types` dan `.next/dev/types`
- `next-env.d.ts` — reference generated Next types, saat ini menunjuk `.next/dev/types/routes.d.ts`
- `prisma.config.ts` — schema, migration path, seed command
- `prisma/seed.ts` — seed owner, primary domain, default mailbox, sensitive alias, AI preference default

## 8. File-by-File Detail

### App shell and entry points

#### `apps/web/app/layout.tsx`
- **Purpose**: root HTML shell untuk semua halaman.
- **Main exports/functions**: `metadata`, `RootLayout`.
- **Dependencies**: `next` metadata typing, `./globals.css`.
- **Data flow / behavior**: inject global CSS, render `children` dalam `<html>` dan `<body>`.
- **Review notes**: `suppressHydrationWarning` ditambahkan di `<html>` dan `<body>`, tanda ada mismatch hydration yang ditoleransi, bukan akar masalah yang diselesaikan.

#### `apps/web/app/globals.css`
- **Purpose**: global Tailwind import dan theme dasar body.
- **Main exports/functions**: none.
- **Dependencies**: Tailwind v4 style import, `../tailwind.config.ts`.
- **Data flow / behavior**: load Tailwind dan set dark palette global.
- **Review notes**: migrasi dari directive Tailwind lama ke `@import "tailwindcss"` + `@config` menandakan setup mengikuti Tailwind/Next terbaru.

#### `apps/web/app/page.tsx`
- **Purpose**: root route redirector.
- **Main exports/functions**: `HomePage`.
- **Dependencies**: `redirect` from Next navigation.
- **Data flow / behavior**: semua akses `/` langsung ke `/dashboard`.
- **Review notes**: tidak ada landing page publik; akses utama diasumsikan dashboard.

#### `apps/web/app/login/page.tsx`
- **Purpose**: halaman login owner.
- **Main exports/functions**: `LoginPage`.
- **Dependencies**: `loginAction`, `Button`, `Card`, `Input`.
- **Data flow / behavior**: form POST ke server action login; UI premium dark-theme.
- **Review notes**: belum terlihat render error state query param pada UI meski action redirect dengan `?error=`.

#### `apps/web/app/login/2fa/page.tsx`
- **Purpose**: challenge screen TOTP setelah login password lolos.
- **Main exports/functions**: `TwoFactorPage`.
- **Dependencies**: `verifyTwoFactorAction`, `Button`, `Card`, `Input`.
- **Data flow / behavior**: kirim token 6 digit ke action verifikasi.
- **Review notes**: seperti login page, error state URL belum ditampilkan ke user.

### Auth actions

#### `apps/web/app/actions/auth.ts`
- **Purpose**: seluruh flow login/logout owner dan 2FA.
- **Main exports/functions**: `loginAction`, `verifyTwoFactorAction`, `logoutAction`.
- **Dependencies**: Prisma, password verify, session helper, audit log, decrypt secret, 2FA helpers.
- **Data flow / behavior**:
  - `loginAction` baca user by email
  - reject bila user tidak ada / tidak aktif
  - verify password
  - jika 2FA aktif, buat pending session 5 menit lalu redirect `/login/2fa`
  - jika tidak, set session penuh lalu redirect `/dashboard`
  - semua failure / gate event dicatat ke audit log
  - `verifyTwoFactorAction` validasi pending session, cek expiry, cek owner aktif, decrypt secret, verify TOTP, update lockout counter, lalu promote pending session jadi full session
  - `logoutAction` destroy session dan redirect login
- **Review notes**:
  - flow security cukup rapi untuk MVP
  - `auth.login` dicatat baik setelah login tanpa 2FA maupun setelah challenge 2FA selesai
  - tidak ada rate limit berbasis IP, baru lockout level user untuk 2FA
  - logout tidak membuat audit log

### Mailbox actions

#### `apps/web/app/actions/mailboxes.ts`
- **Purpose**: mutasi mailbox dari dashboard.
- **Main exports/functions**: `createMailboxAction`, `disableMailboxAction`.
- **Dependencies**: `requireOwner`, Prisma, `createAuditLog`, `buildAddress`, `mailboxInputSchema`.
- **Data flow / behavior**:
  - parse form dengan Zod
  - ambil domain untuk compose address
  - create mailbox dengan `ownerUserId` dari session
  - disable hanya ubah status jadi `disabled`
  - revalidate `/dashboard/mailboxes`
- **Review notes**: tidak ada duplicate handling eksplisit di level action; bergantung ke constraint database.

### Alias actions

#### `apps/web/app/actions/aliases.ts`
- **Purpose**: mutasi alias dari dashboard.
- **Main exports/functions**: `createAliasAction`, `disableAliasAction`.
- **Dependencies**: `requireOwner`, Prisma, `createAuditLog`, `buildAddress`, `aliasInputSchema`.
- **Data flow / behavior**:
  - parse form
  - ambil domain
  - create alias dengan address lowercase, destination mailbox opsional, expiry opsional, notes/tags
  - disable ubah status ke `disabled`
  - revalidate `/dashboard/aliases`
- **Review notes**: boundary provider belum dipakai; create alias masih pure DB write tanpa sync eksternal.

### Routing rule actions

#### `apps/web/app/actions/routing-rules.ts`
- **Purpose**: mutasi routing rule.
- **Main exports/functions**: `createRoutingRuleAction`, `disableRoutingRuleAction`.
- **Dependencies**: `requireOwner`, Prisma, audit helper, `routingRuleInputSchema`.
- **Data flow / behavior**:
  - parse form field string
  - `conditionJson` dan `destinationJson` di-`JSON.parse()` sebelum write
  - disable ubah `enabled` ke `false`
  - revalidate `/dashboard/rules`
- **Review notes**: validasi JSON masih bentuk string minimum length; invalid JSON baru meledak saat `JSON.parse()`, bukan dari schema.

### Dashboard layout and navigation

#### `apps/web/app/dashboard/layout.tsx`
- **Purpose**: shell dashboard owner terproteksi.
- **Main exports/functions**: `DashboardLayout`.
- **Dependencies**: `logoutAction`, `DashboardNav`, `requireOwner`.
- **Data flow / behavior**: guard semua route dashboard, tampilkan sidebar, email owner, nav, dan tombol sign out.
- **Review notes**: proteksi route terpusat bagus; semua child route ikut guard by layout.

#### `apps/web/components/dashboard/nav.tsx`
- **Purpose**: nav dashboard dengan current-page state.
- **Main exports/functions**: `DashboardNav`.
- **Dependencies**: `usePathname`, `Link`.
- **Data flow / behavior**: hitung `isActive` exact match atau nested path match.
- **Review notes**: logic active state cukup aman; `/dashboard` tidak menelan semua child route karena ada pengecualian khusus.

### Dashboard pages

#### `apps/web/app/dashboard/page.tsx`
- **Purpose**: ringkasan operasional utama.
- **Main exports/functions**: `DashboardPage`, `dynamic = "force-dynamic"`.
- **Dependencies**: UI primitives, Prisma.
- **Data flow / behavior**: count domain/mailbox/alias/event/audit log; ambil hingga 5 domain pending/degraded; render stats, attention card, quick links.
- **Review notes**: dashboard membaca status tersimpan, bukan hasil health check realtime.

#### `apps/web/app/dashboard/domains/page.tsx`
- **Purpose**: daftar domain dan status verifikasi.
- **Main exports/functions**: `DomainsPage`.
- **Dependencies**: `EmptyState`, `PageHeader`, `SectionCard`, `StatCard`, `StatusBadge`, Prisma.
- **Data flow / behavior**: load semua domain, hitung total/verified/pending/attention, render cards.
- **Review notes**: belum ada create/update domain flow; halaman masih observasional.

#### `apps/web/app/dashboard/mailboxes/page.tsx`
- **Purpose**: create dan disable mailbox.
- **Main exports/functions**: `MailboxesPage`.
- **Dependencies**: mailbox actions, `Card`, `Input`, Prisma.
- **Data flow / behavior**: load domain + mailbox; form create di kiri; list mailbox di kanan.
- **Review notes**: page campur data load, form, dan list dalam satu file; masih wajar untuk MVP tapi bisa membesar cepat.

#### `apps/web/app/dashboard/aliases/page.tsx`
- **Purpose**: create dan disable alias.
- **Main exports/functions**: `AliasesPage`.
- **Dependencies**: alias actions, `Card`, `Input`, Prisma.
- **Data flow / behavior**: load domain, mailbox, alias; form create alias; list alias existing.
- **Review notes**: destination mailbox di-load penuh tanpa pagination/filter.

#### `apps/web/app/dashboard/rules/page.tsx`
- **Purpose**: create dan disable routing rule.
- **Main exports/functions**: `RulesPage`.
- **Dependencies**: rule actions, `Card`, `Input`, Prisma.
- **Data flow / behavior**: form domain/alias/action/json/priority/enabled; list rules sorted by priority.
- **Review notes**: UX JSON raw string cocok untuk developer seed/admin awal, belum cocok untuk operator non-teknis.

#### `apps/web/app/dashboard/logs/page.tsx`
- **Purpose**: tampilkan audit logs dan email events terbaru.
- **Main exports/functions**: `LogsPage`.
- **Dependencies**: `Card`, Prisma.
- **Data flow / behavior**: ambil 50 audit log terbaru dan 50 email event terbaru; render dua kolom.
- **Review notes**: belum ada filter, pagination, atau detail metadata log.

#### `apps/web/app/dashboard/settings/page.tsx`
- **Purpose**: status placeholder untuk provider dan AI privacy.
- **Main exports/functions**: `SettingsPage`.
- **Dependencies**: `Card`.
- **Data flow / behavior**: render dua info card statis.
- **Review notes**: belum ada setting interaktif; lebih seperti roadmap/status page.

### UI primitives

#### `apps/web/components/ui/button.tsx`
- **Purpose**: base button styling.
- **Main exports/functions**: `Button`.
- **Dependencies**: HTML button props.
- **Data flow / behavior**: merge `className` dengan class default.
- **Review notes**: belum pakai utility merge helper; raw template string cukup untuk scope saat ini.

#### `apps/web/components/ui/input.tsx`
- **Purpose**: base input styling.
- **Main exports/functions**: `Input`.
- **Dependencies**: HTML input props.
- **Data flow / behavior**: pass-through props + shared classes.
- **Review notes**: tidak mengelola label/error/help text; hanya primitive visual.

#### `apps/web/components/ui/card.tsx`
- **Purpose**: container visual reusable.
- **Main exports/functions**: `Card`.
- **Dependencies**: React children.
- **Data flow / behavior**: wrapper div dengan backdrop/dark glass style.
- **Review notes**: dipakai luas sebagai visual consistency anchor.

#### `apps/web/components/ui/page-header.tsx`
- **Purpose**: heading dashboard konsisten.
- **Main exports/functions**: `PageHeader`.
- **Dependencies**: optional `action` ReactNode.
- **Data flow / behavior**: render eyebrow, title, description, action slot.
- **Review notes**: cocok untuk pages observasional dan management.

#### `apps/web/components/ui/stat-card.tsx`
- **Purpose**: ringkasan angka.
- **Main exports/functions**: `StatCard`.
- **Dependencies**: `Card`.
- **Data flow / behavior**: render label, value, helper text opsional.
- **Review notes**: sederhana, tidak ada trend/delta.

#### `apps/web/components/ui/status-badge.tsx`
- **Purpose**: visual mapping dari string status ke warna semantic.
- **Main exports/functions**: `StatusBadge`.
- **Dependencies**: internal `statusClasses` map.
- **Data flow / behavior**: normalize lowercase, pilih class fallback `neutral`, render status text.
- **Review notes**: satu map menangani status entity sekaligus action/rule type; praktis tapi bisa tumbuh campur concern.

#### `apps/web/components/ui/section-card.tsx`
- **Purpose**: section wrapper berbasis `Card` dengan header opsional.
- **Main exports/functions**: `SectionCard`.
- **Dependencies**: `Card`.
- **Data flow / behavior**: render title/description/action jika ada, lalu children.
- **Review notes**: menolong compose dashboard tanpa duplikasi layout.

#### `apps/web/components/ui/empty-state.tsx`
- **Purpose**: tampilan state kosong reusable.
- **Main exports/functions**: `EmptyState`.
- **Dependencies**: optional `action` ReactNode.
- **Data flow / behavior**: render title, description, action area.
- **Review notes**: dipakai di domains page; bisa dipakai lebih banyak page lain yang saat ini langsung list kosong.

### Libraries

#### `apps/web/lib/db.ts`
- **Purpose**: inisialisasi dan singleton Prisma client.
- **Main exports/functions**: `prisma`.
- **Dependencies**: `@prisma/adapter-pg`, `@prisma/client`, `DATABASE_URL`.
- **Data flow / behavior**: buat adapter PG, reuse instance lewat `globalThis` saat dev.
- **Review notes**: pattern standar Next dev agar tidak spawn client berulang.

#### `apps/web/lib/audit.ts`
- **Purpose**: helper create audit log terstandardisasi.
- **Main exports/functions**: `createAuditLog`.
- **Dependencies**: Prisma types/client.
- **Data flow / behavior**: wrap `prisma.auditLog.create` dan isi metadata default `{}`.
- **Review notes**: helper kecil tapi penting untuk konsistensi semua action.

#### `apps/web/lib/auth/password.ts`
- **Purpose**: hash dan verify password.
- **Main exports/functions**: `hashPassword`, `verifyPassword`.
- **Dependencies**: `bcryptjs`.
- **Data flow / behavior**: hash dengan `saltRounds = 12`, verify via bcrypt compare.
- **Review notes**: cukup aman untuk MVP owner login.

#### `apps/web/lib/auth/secrets.ts`
- **Purpose**: enkripsi secret sensitif seperti TOTP secret atau credential lain.
- **Main exports/functions**: `encryptSecret`, `decryptSecret`, `tryDecryptSecret`.
- **Dependencies**: Node crypto, `APP_ENCRYPTION_KEY`.
- **Data flow / behavior**: hash env key ke 32-byte key, encrypt AES-256-GCM, serialize `iv:tag:ciphertext` base64.
- **Review notes**: `tryDecryptSecret` dipakai untuk safe failure path saat payload rusak atau key berubah.

#### `apps/web/lib/auth/session.ts`
- **Purpose**: akses session dan owner authorization gate.
- **Main exports/functions**: `getSessionPassword`, `isActiveOwner`, `getSession`, `requireOwner`.
- **Dependencies**: `iron-session`, Next cookies/navigation, Prisma.
- **Data flow / behavior**:
  - ambil password session dari env
  - set cookie options
  - load iron session
  - `requireOwner()` cek session userId, load user DB, verify owner aktif, destroy session jika invalid, redirect login bila gagal
- **Review notes**: guard auth sebenarnya bergantung DB setiap request dashboard, bagus untuk revoke access cepat.

#### `apps/web/lib/auth/two-factor.ts`
- **Purpose**: helper policy dan verifikasi TOTP.
- **Main exports/functions**: constants lockout, `shouldRequireTwoFactor`, `isTwoFactorLocked`, `getTwoFactorLockoutDate`, `verifyTwoFactorCode`.
- **Dependencies**: `otplib`.
- **Data flow / behavior**: status 2FA ditentukan dari boolean user, lockout dari timestamp, verify token via otplib.
- **Review notes**: logic sengaja tipis; persistence counter tetap di action auth.

#### `apps/web/lib/validation/email.ts`
- **Purpose**: validasi local-part email dan build address.
- **Main exports/functions**: `isValidLocalPart`, `buildAddress`.
- **Dependencies**: regex lokal.
- **Data flow / behavior**: validasi karakter, cegah `..`, normalize lowercase untuk address.
- **Review notes**: cukup ketat untuk MVP, mungkin menolak beberapa local-part RFC-valid yang jarang dipakai.

#### `apps/web/lib/validation/schemas.ts`
- **Purpose**: schema input server action.
- **Main exports/functions**: `mailboxInputSchema`, `aliasInputSchema`, `routingRuleInputSchema`.
- **Dependencies**: Zod, `isValidLocalPart`.
- **Data flow / behavior**: parse typed form inputs, default boolean/status/type, coercion priority number.
- **Review notes**: `routingRuleInputSchema` belum validasi struktur JSON semantik; baru string length + enum.

#### `apps/web/lib/providers/types.ts`
- **Purpose**: kontrak boundary provider eksternal.
- **Main exports/functions**: types dan interfaces routing/sending/DNS.
- **Dependencies**: none internal.
- **Data flow / behavior**: jadi interface seam antara business logic dan provider spesifik nanti.
- **Review notes**: selaras dengan arah CLAUDE.md; boundary sudah disiapkan walau belum dipakai luas.

#### `apps/web/lib/providers/mock.ts`
- **Purpose**: mock provider sementara.
- **Main exports/functions**: `MockEmailRoutingProvider`, `MockEmailSendingProvider`, `MockDnsProvider`.
- **Dependencies**: provider types.
- **Data flow / behavior**: return verification/status dummy dan list kosong.
- **Review notes**: belum terhubung ke page/action mana pun; lebih sebagai placeholder architecture than active runtime path.

### Config and generated-type bridge

#### `apps/web/package.json`
- **Purpose**: manifest package web app.
- **Main exports/functions**: scripts dan dependency list.
- **Dependencies**: Next, React, Prisma, Tailwind, Vitest, auth libs.
- **Data flow / behavior**: mendefinisikan workflow dev/build/test/db.
- **Review notes**: banyak versi masih `latest`; bagus untuk speed awal, buruk untuk reproducibility jangka menengah.

#### `apps/web/next.config.ts`
- **Purpose**: slot config Next.
- **Main exports/functions**: `nextConfig`.
- **Dependencies**: `NextConfig` type.
- **Data flow / behavior**: saat ini no-op config.
- **Review notes**: file placeholder, belum punya behavior custom.

#### `apps/web/tailwind.config.ts`
- **Purpose**: Tailwind content scan dan theme extension.
- **Main exports/functions**: default config export.
- **Dependencies**: Tailwind config type.
- **Data flow / behavior**: scan `app/components/lib`; tambah color `ink`.
- **Review notes**: setup minimal; styling banyak tetap lewat utility class inline.

#### `apps/web/vitest.config.ts`
- **Purpose**: config unit test.
- **Main exports/functions**: default `defineConfig`.
- **Dependencies**: `vitest/config`, Node URL.
- **Data flow / behavior**: env `node`, globals true, include `tests/**/*.test.ts`, alias `@`.
- **Review notes**: cocok untuk helper tests dan SSR static render tests; belum setup browser/jsdom default.

#### `apps/web/tsconfig.json`
- **Purpose**: TypeScript compiler config.
- **Main exports/functions**: compiler options.
- **Dependencies**: Next plugin, alias path.
- **Data flow / behavior**: strict mode, no emit, bundler resolution, include generated Next route types.
- **Review notes**: include `.next/dev/types/**/*.ts` sinkron dengan perubahan di `next-env.d.ts`.

#### `apps/web/next-env.d.ts`
- **Purpose**: bridge type reference ke generated Next types.
- **Main exports/functions**: triple-slash refs + import route types.
- **Dependencies**: generated `.next/dev/types/routes.d.ts`.
- **Data flow / behavior**: memastikan route typing tersedia untuk compile-time.
- **Review notes**: file biasanya generated/managed Next; perubahan manual bisa kepengaruh upgrade/regenerate.

#### `apps/web/prisma.config.ts`
- **Purpose**: konfigurasi Prisma CLI.
- **Main exports/functions**: `defineConfig` export.
- **Dependencies**: `dotenv/config`, `prisma/config`.
- **Data flow / behavior**: set schema path, migration path, seed command, env URL.
- **Review notes**: clean, explicit, cocok monorepo-ish layout.

#### `apps/web/prisma/seed.ts`
- **Purpose**: seed data owner dan baseline domain/mailbox/alias preference.
- **Main exports/functions**: `main()` script.
- **Dependencies**: dotenv, Prisma, `hashPassword`.
- **Data flow / behavior**:
  - require seed owner email/password env
  - upsert owner aktif
  - upsert primary domain `freakyswan.my.id`
  - upsert mailbox default termasuk `founder`, `admin`, `billing`, `security`
  - upsert alias sensitif dengan tags `ai-disabled`
  - set AI preference default metadata-only
- **Review notes**: seed sudah memuat kebijakan privacy dari product direction, terutama alias sensitif.

### Tests

#### `apps/web/tests/audit.test.ts`
- **Purpose**: verifikasi helper audit membentuk payload Prisma benar.
- **Main exports/functions**: test suite `createAuditLog`.
- **Dependencies**: Vitest mock.
- **Data flow / behavior**: mock `prisma.auditLog.create`, assert argumen call.
- **Review notes**: fokus ke contract helper, bukan DB nyata.

#### `apps/web/tests/auth-2fa.test.ts`
- **Purpose**: verifikasi predicate perlu/tidaknya challenge 2FA.
- **Main exports/functions**: suite `2FA gate`.
- **Dependencies**: `shouldRequireTwoFactor`.
- **Data flow / behavior**: assert boolean based on `twoFactorEnabled`.
- **Review notes**: sangat tipis, tapi menjaga policy helper.

#### `apps/web/tests/password.test.ts`
- **Purpose**: verifikasi hashing password.
- **Main exports/functions**: suite `password helpers`.
- **Dependencies**: bcrypt helper.
- **Data flow / behavior**: hash lalu verify benar/salah.
- **Review notes**: baseline correctness check.

#### `apps/web/tests/secrets.test.ts`
- **Purpose**: verifikasi encrypt/decrypt secret dan failure path.
- **Main exports/functions**: suite `secret encryption`.
- **Dependencies**: secret helpers.
- **Data flow / behavior**: round-trip success, missing key throw, invalid payload throw, safe decrypt null.
- **Review notes**: test paling penting untuk material sensitif.

#### `apps/web/tests/session.test.ts`
- **Purpose**: verifikasi requirement env session dan owner predicate.
- **Main exports/functions**: suite `session security`.
- **Dependencies**: session helpers.
- **Data flow / behavior**: assert env missing throw, active owner predicate behavior.
- **Review notes**: tidak menyentuh actual iron-session I/O.

#### `apps/web/tests/two-factor.test.ts`
- **Purpose**: verifikasi TOTP helper dan lockout timestamp helper.
- **Main exports/functions**: suite `two-factor verification`.
- **Dependencies**: otplib generate/generateSecret, 2FA helpers.
- **Data flow / behavior**: generate real secret/token lalu verify; assert invalid token false; assert lockout comparison.
- **Review notes**: memberi confidence helper TOTP benar.

#### `apps/web/tests/validation.test.ts`
- **Purpose**: verifikasi email/local-part dan Zod schema.
- **Main exports/functions**: suite `email validation`.
- **Dependencies**: validation helpers, schemas.
- **Data flow / behavior**: test valid/invalid local-part, normalized address, mailbox/alias schema parse success.
- **Review notes**: belum test case schema failure detail.

#### `apps/web/tests/ui-components.test.ts`
- **Purpose**: verifikasi primitive UI render output penting.
- **Main exports/functions**: suite `soft premium UI primitives`.
- **Dependencies**: React SSR static render, primitive UI.
- **Data flow / behavior**: render ke static markup lalu assert text/href/label penting.
- **Review notes**: bukan visual regression, tapi cukup untuk memastikan contract output minimum.

## 9. Gaps and Risks Summary

### Kuat saat ini
- Boundary auth owner + 2FA sudah cukup jelas.
- Audit logging sudah masuk ke flow mutasi dan auth penting.
- Provider abstraction sudah disiapkan.
- Seed selaras dengan aturan mailbox/alias sensitif.
- UI dashboard sudah punya language visual konsisten.

### Gap utama
- Belum ada flow domain setup wizard nyata di `apps/web` saat ini.
- Page belum menampilkan error/success feedback dari query params atau action result.
- Provider sync nyata belum terhubung; banyak area masih DB-only atau copy placeholder.
- Routing rule JSON UX masih mentah.
- Test belum cover server actions, route protection end-to-end, atau page interaction.
- Banyak dependency `latest`; reproducibility dan upgrade control masih lemah.

### Risiko review
- `suppressHydrationWarning` bisa menyembunyikan mismatch nyata.
- `next-env.d.ts` import `.next/dev/types/routes.d.ts` bergantung layout generated file dev saat ini.
- Banyak page management masih file tunggal; growth bisa cepat bikin file gemuk.
- Validasi `conditionJson` dan `destinationJson` belum struktural.

## 10. Saran pakai dokumen ini

Kalau kamu review bertahap, urutan paling efektif:
1. `lib/auth/*` + `app/actions/auth.ts`
2. `lib/validation/*` + `app/actions/*`
3. `app/dashboard/*`
4. `components/ui/*`
5. config + seed + tests
