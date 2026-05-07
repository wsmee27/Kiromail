# PRD — FreakySwan Personal & Team Email Platform

**Domain:** `freakyswan.my.id`  
**Versi:** 2.0  
**Tanggal:** 7 Mei 2026  
**Owner:** FreakySwan / AI Travel Vision  
**Target pembaca:** Owner, full-stack developer, AI coding agent  
**Status:** Draft lengkap untuk validasi teknis dan implementasi MVP

---

## 1. Executive Summary

FreakySwan membutuhkan sistem email pribadi dan tim kecil berbasis domain `freakyswan.my.id` yang dapat dipakai untuk bisnis, personal branding, komunikasi pribadi penting, dan keperluan operasional. Produk ini tidak hanya berupa konfigurasi email domain, tetapi juga sebuah **dashboard internal** untuk mengelola mailbox, alias, forwarding, rules, audit log, backup, deliverability, dan fitur AI.

Arah brand: **tech/startup premium**. Sistem harus terlihat profesional, aman, fleksibel, dan bisa berkembang menjadi SaaS/public product di masa depan.

Constraint utama:

- Budget awal: **gratis / open-source sebisa mungkin**.
- Domain utama sudah dipakai sebagai landing page portofolio.
- Pengguna awal: owner + team kecil.
- Email harus bisa **menerima dan mengirim** dari domain.
- Inbox harus **terpisah per akun**, idealnya tetap nyaman dibaca melalui Gmail.
- Privasi sangat penting.
- Butuh enkripsi end-to-end, backup, dan audit log untuk owner.
- Volume pengiriman: sedang sampai banyak, dengan rencana newsletter.
- Owner adalah full-stack developer dan bersedia maintain sendiri.

Kesimpulan rekomendasi:

> **Bangun MVP sebagai hybrid email platform, bukan langsung self-host full mail server untuk email utama.**
>
> Gunakan Cloudflare untuk DNS/email routing layer, Mailtrap untuk outbound transactional/bulk, Gmail sebagai client baca harian, dan dashboard custom di VPS untuk alias/rules/logs/AI. Self-host full mail server open-source seperti Stalwart dapat menjadi Phase 2/advanced setelah reputasi domain, backup, monitoring, dan deliverability process matang.

---

## 2. Problem Statement

Pemilik domain `freakyswan.my.id` ingin memiliki email profesional yang:

1. Bebas membuat alamat email sesuai kebutuhan.
2. Bisa digunakan oleh owner dan tim kecil.
3. Memiliki inbox terpisah per akun.
4. Bisa mengirim dan menerima email dari domain sendiri.
5. Mendukung privasi tinggi dan enkripsi.
6. Memiliki dashboard internal untuk kontrol penuh.
7. Bisa berkembang menjadi SaaS/public product.
8. Tetap hemat biaya dan sebisa mungkin open-source.

Masalah utama yang harus diselesaikan:

- Email domain terlihat profesional, bukan sekadar forwarding acak.
- Deliverability harus baik agar email tidak masuk spam.
- Domain utama sudah dipakai untuk landing page, sehingga email tidak boleh mengganggu website.
- Free/open-source self-hosting berisiko tinggi untuk email utama karena reputasi IP, blacklist, downtime, spam filtering, dan maintenance.
- E2EE email sulit digabungkan sempurna dengan Gmail, SMTP tradisional, dan AI features karena AI perlu membaca isi email.
- Newsletter/bulk email tidak boleh merusak reputasi domain utama.

---

## 3. Product Vision

Membangun **FreakySwan Mail OS**, yaitu dashboard email domain pribadi untuk owner dan tim kecil yang menggabungkan:

- identity layer: mailbox, alias, role address;
- routing layer: forwarding, catch-all, rules;
- sending layer: SMTP/API untuk outbound;
- security layer: SPF, DKIM, DMARC, 2FA, encryption policy;
- observability layer: logs, status, audit trail;
- AI layer: summary, auto-label, urgent detection, draft assistant;
- growth layer: newsletter, CRM-lite, campaign segmentation;
- future SaaS layer: multi-tenant workspace, billing, API, self-service onboarding.

Produk ini harus terasa seperti kombinasi antara:

- SimpleLogin / Addy.io untuk alias dan privacy;
- Cloudflare Email Routing untuk email routing;
- Mailtrap / Resend untuk developer-friendly email sending;
- Gmail-like inbox workflow;
- Linear/Stripe-style dashboard experience.

---

## 4. Goals

### 4.1 Business Goals

- Meningkatkan profesionalitas personal brand FreakySwan.
- Memisahkan komunikasi bisnis, pribadi, support, billing, dan marketing.
- Menyiapkan fondasi untuk tim kecil.
- Menjaga reputasi domain utama.
- Membangun aset produk yang suatu saat bisa menjadi SaaS.

### 4.2 User Goals

- Owner bisa membuat email/alias kapan pun tanpa konfigurasi manual berulang.
- Tim bisa punya inbox masing-masing.
- Email bisa dibaca nyaman via Gmail.
- Email bisa dikirim dari alamat domain.
- Sistem aman untuk akun penting.
- Owner bisa melihat audit log dan backup.
- Newsletter bisa dijalankan tanpa merusak reputasi email utama.

### 4.3 Technical Goals

- DNS email valid: MX, SPF, DKIM, DMARC.
- Routing fleksibel: custom address, alias, catch-all, disposable alias.
- Outbound terpisah berdasarkan jenis email: personal, transactional, marketing.
- Observability: delivery log, bounce, complaint, webhook, audit trail.
- Backup dan disaster recovery.
- Modular agar provider bisa diganti.
- Siap multi-tenant di masa depan.

---

## 5. Non-Goals

Untuk MVP, produk **tidak** harus:

- Menjadi pengganti Gmail penuh.
- Membangun webmail lengkap dari nol.
- Menjalankan newsletter skala besar sejak hari pertama.
- Menjamin E2EE sempurna untuk semua jenis email, karena email eksternal umumnya tidak E2EE by default.
- Menjadi full SaaS publik di release pertama.
- Self-host mail server utama sejak awal, kecuali setelah mitigasi risiko selesai.

---

## 6. User Personas

### 6.1 Owner / Founder

**Profil:** Full-stack developer, pemilik domain, pengambil keputusan teknis dan produk.  
**Kebutuhan:** Kontrol penuh, privasi tinggi, audit log, backup, fleksibilitas alias, integrasi AI, dashboard admin.  
**Pain point:** Tidak ingin bergantung sepenuhnya pada provider mahal, tetapi tetap butuh sistem stabil.

### 6.2 Team Member

**Profil:** Anggota tim kecil yang butuh email profesional.  
**Kebutuhan:** Inbox terpisah, bisa kirim/terima email domain, setup mudah, tidak perlu melihat audit log teknis.  
**Pain point:** Tidak ingin ribet dengan DNS/SMTP.

### 6.3 Future SaaS User

**Profil:** Creator/founder/developer lain yang punya domain dan ingin email dashboard serupa.  
**Kebutuhan:** Onboarding domain, alias, forwarding, logs, basic analytics, simple billing.  
**Pain point:** Setup email domain terasa rumit dan penuh istilah teknis.

---

## 7. Recommended Email Identity Structure

Karena kamu ingin bebas membuat alamat apa pun, sistem harus mendukung **mailbox utama + alias fleksibel**.

### 7.1 Mailbox Utama

Rekomendasi mailbox asli untuk owner + tim kecil:

| Mailbox | Tujuan | Inbox |
|---|---|---|
| `founder@freakyswan.my.id` | identitas founder/owner profesional | inbox owner |
| `hello@freakyswan.my.id` | kontak publik personal branding | inbox owner atau shared |
| `team@freakyswan.my.id` | komunikasi umum tim | shared/team inbox |
| `support@freakyswan.my.id` | bantuan, pertanyaan, future product | shared/team inbox |
| `admin@freakyswan.my.id` | akun admin internal, hosting, tools | inbox owner, protected |
| `billing@freakyswan.my.id` | invoice, payment, SaaS tools | inbox owner/finance |
| `security@freakyswan.my.id` | laporan keamanan dan recovery | inbox owner, high security |

### 7.2 Alias Fleksibel

Alias untuk privasi dan segmentasi:

| Alias pattern | Contoh | Tujuan |
|---|---|---|
| service alias | `github@`, `cloudflare@`, `vercel@` | akun penting dan tracking leak |
| personal alias | `me@`, `contact@` | fleksibilitas personal |
| marketing alias | `newsletter@`, `updates@` | campaign/newsletter |
| project alias | `project-x@`, `labs@` | eksperimen/startup |
| disposable alias | `tmp-xxxx@` | signup sementara |
| plus addressing | `founder+github@` | filtering cepat |

### 7.3 Catch-All Policy

Rekomendasi:

- Aktifkan catch-all hanya jika dashboard sudah punya spam/rules layer.
- Default catch-all masuk ke **quarantine**, bukan langsung inbox.
- Owner bisa approve address baru dari quarantine menjadi alias resmi.
- Untuk keamanan, jangan pakai catch-all untuk akun sangat penting tanpa alias eksplisit.

---

## 8. Product Architecture Recommendation

### 8.1 Architecture Decision

Ada tiga opsi besar:

#### Opsi A — Full Managed Email

Contoh: Google Workspace, Proton Mail, Fastmail, Zoho Mail.

Kelebihan:

- Stabil.
- Deliverability bagus.
- Setup relatif mudah.
- Cocok untuk email utama.

Kekurangan:

- Tidak gratis untuk tim dan custom domain serius.
- Kurang open-source.
- Dashboard custom terbatas.

#### Opsi B — Full Self-Hosted Mail Server

Contoh: Stalwart, Mailcow, Docker Mailserver, Poste.io.

Kelebihan:

- Open-source.
- Kontrol penuh.
- Bisa membangun fitur custom sangat dalam.

Kekurangan:

- Deliverability sulit.
- Risiko blacklist IP VPS.
- Maintenance tinggi.
- Downtime berarti email hilang/tertunda.
- Butuh monitoring 24/7.

#### Opsi C — Hybrid MVP

Gabungan:

- Cloudflare untuk DNS dan inbound routing.
- Gmail sebagai inbox/client harian.
- Mailtrap untuk outbound transactional/bulk/API.
- Dashboard custom untuk alias/rules/logs/AI/admin.
- Optional self-host Stalwart sebagai lab/phase 2.

Kelebihan:

- Gratis/hemat di awal.
- Risiko lebih rendah dibanding self-host penuh.
- Tetap developer-friendly.
- Bisa berkembang menjadi SaaS.
- Domain utama bisa tetap untuk landing page.

Kekurangan:

- E2EE tidak sempurna jika memakai Gmail/forwarding.
- Beberapa fitur bergantung provider.
- Perlu desain abstraction layer agar provider bisa diganti.

### 8.2 Recommended Path

**Rekomendasi utama: Opsi C — Hybrid MVP.**

Alasan:

- Sesuai budget gratis/open-source.
- Lebih aman untuk tahap awal.
- Memungkinkan dashboard custom tanpa langsung mengambil risiko mail server penuh.
- Tetap bisa mengirim/terima dari domain.
- Cocok untuk owner full-stack developer.
- Bisa naik kelas ke self-host atau managed provider kapan saja.

---

## 9. Proposed System Components

### 9.1 Inbound Email Layer

Fungsi:

- Menerima email ke `@freakyswan.my.id`.
- Menerapkan routing rules.
- Forward ke inbox Gmail/team.
- Menangani catch-all.
- Menjalankan filtering awal.

Rekomendasi awal:

- Cloudflare Email Routing jika domain dipindahkan nameserver ke Cloudflare.
- Cloudflare Email Workers untuk logic custom.
- Alternatif open-source: SimpleLogin self-host / Addy.io self-host style architecture.

Catatan:

- Cloudflare Email Routing historisnya forward-only dan tidak menyediakan SMTP outbound langsung.
- Untuk outbound, gunakan Mailtrap SMTP/API atau provider SMTP lain.

### 9.2 Outbound Email Layer

Fungsi:

- Mengirim email dari alamat domain.
- Menjaga deliverability.
- Memisahkan transactional, personal, dan bulk.
- Menyediakan logs, bounce, unsubscribe, tracking.

Rekomendasi:

- **Personal/team sending:** SMTP provider yang bisa dipakai di Gmail “Send mail as”.
- **Transactional/bulk:** Mailtrap Email API/SMTP.
- **Newsletter:** gunakan subdomain terpisah seperti `mail.freakyswan.my.id` atau `updates.freakyswan.my.id`.

### 9.3 Dashboard Layer

Fungsi:

- Kelola user/team.
- Kelola mailbox dan alias.
- Kelola forwarding destinations.
- Kelola catch-all.
- Lihat logs dan audit trail.
- Configure outbound identities.
- Monitor DNS health.
- AI summarization dan rules.

### 9.4 Storage Layer

Fungsi:

- Menyimpan metadata, bukan isi email penuh untuk MVP.
- Menyimpan audit log, routing config, provider config, webhook event.
- Menyimpan AI summaries jika user mengaktifkan fitur AI.

Rekomendasi:

- PostgreSQL sebagai database utama.
- Redis untuk queue/rate limit/session/cache.
- S3-compatible object storage untuk backup/export attachment/log snapshot jika diperlukan.

### 9.5 AI Layer

Fungsi opsional:

- Daily digest.
- Urgency detection.
- Auto-label.
- Phishing/spam scoring.
- Draft reply assistant.
- Semantic search.

Privacy mode:

- Default AI membaca metadata saja.
- User harus opt-in untuk AI membaca body email.
- Untuk email sensitif, AI processing dimatikan.
- Semua prompt/log AI harus bisa dihapus.

---

## 10. App Flow

### 10.1 Owner Onboarding Flow

1. Owner login ke dashboard.
2. Sistem meminta domain: `freakyswan.my.id`.
3. Owner memilih mode setup:
   - Hybrid recommended.
   - Self-host advanced.
   - Managed provider compatibility.
4. Sistem menampilkan DNS checklist:
   - MX records.
   - SPF TXT.
   - DKIM CNAME/TXT.
   - DMARC TXT.
   - tracking/bounce subdomain jika outbound provider membutuhkan.
5. Owner memasukkan provider API keys:
   - Cloudflare API token.
   - Mailtrap API token.
6. Sistem menjalankan DNS verification.
7. Sistem membuat default mailbox/alias template.
8. Owner mengundang team member.
9. Owner mengaktifkan backup dan audit log.

### 10.2 Team Member Invite Flow

1. Owner invite team member via email.
2. Team member menerima invite.
3. Team member membuat akun dashboard.
4. Sistem assign mailbox/alias.
5. Sistem menampilkan instruksi Gmail setup:
   - receive via forwarding/inbox;
   - send as via SMTP;
   - signature template;
   - security recommendation.
6. Team member melakukan test send/receive.
7. Status berubah menjadi “active”.

### 10.3 Create Alias Flow

1. User klik “Create Alias”.
2. User memilih alias:
   - custom: `name@freakyswan.my.id`;
   - generated: `service-random@freakyswan.my.id`;
   - disposable: expires after X days.
3. User memilih destination inbox.
4. User memilih rules:
   - forward only;
   - quarantine first;
   - label;
   - block attachments;
   - AI summarize.
5. Sistem membuat routing rule di provider.
6. Sistem menyimpan alias metadata.
7. Sistem menjalankan test email.

### 10.4 Catch-All Quarantine Flow

1. Email masuk ke address yang belum terdaftar.
2. Sistem menangkap via catch-all.
3. Email masuk ke quarantine.
4. Owner mendapat notifikasi.
5. Owner memilih:
   - approve and create alias;
   - forward once;
   - block sender;
   - drop silently;
   - mark spam.
6. Sistem update rules.

### 10.5 Send Email Flow via Gmail

1. User membuka Gmail.
2. User memilih From: `founder@freakyswan.my.id`.
3. Gmail mengirim melalui SMTP provider.
4. Provider menandatangani email dengan DKIM.
5. Sistem menerima webhook/log delivery jika tersedia.
6. Dashboard menampilkan delivery status.

### 10.6 Newsletter Flow

1. Owner membuat list audience.
2. Sistem memastikan marketing subdomain aktif, misalnya `updates.freakyswan.my.id`.
3. Owner memilih template.
4. Sistem menjalankan compliance checklist:
   - unsubscribe link;
   - sender identity;
   - rate limit;
   - suppression list.
5. Email dikirim via Mailtrap bulk stream atau provider setara.
6. Dashboard membaca webhook:
   - delivered;
   - opened;
   - clicked;
   - bounced;
   - unsubscribed.
7. Domain utama tetap terlindungi dari reputasi bulk.

### 10.7 AI Daily Digest Flow

1. Sistem mengambil metadata/email yang diizinkan.
2. Sistem mengelompokkan berdasarkan mailbox, alias, sender, urgency.
3. AI membuat ringkasan harian:
   - urgent;
   - needs reply;
   - invoices;
   - opportunities;
   - noise/newsletter.
4. Digest dikirim ke owner atau ditampilkan di dashboard.
5. User bisa memberi feedback untuk melatih rules, bukan melatih model global.

---

## 11. Core Features

### 11.1 Domain & DNS Manager

Fitur:

- DNS checklist otomatis.
- Verifikasi MX/SPF/DKIM/DMARC.
- Status health domain.
- Alert jika record berubah/rusak.
- Rekomendasi DMARC policy bertahap.

Acceptance criteria:

- Sistem bisa menampilkan status valid/invalid untuk setiap DNS record.
- Sistem bisa memberi instruksi copy-paste record.
- Sistem bisa mendeteksi jika domain belum memakai Cloudflare nameserver.

### 11.2 Mailbox Management

Fitur:

- Create mailbox identity.
- Assign owner/team member.
- Set inbox destination.
- Set send identity.
- Signature template.
- Status active/inactive.

Catatan MVP:

- Mailbox tidak harus berarti inbox disimpan di dashboard.
- Mailbox bisa berarti identity + routing + SMTP identity.

### 11.3 Alias Management

Fitur:

- Unlimited alias secara logical.
- Alias per service.
- Disposable alias.
- Alias expiration.
- Alias notes.
- Alias tags.
- Enable/disable alias.
- Block sender per alias.

### 11.4 Routing Rules

Fitur:

- Forward to one inbox.
- Forward to multiple inboxes jika provider mendukung atau via worker.
- Quarantine.
- Drop silently.
- Auto-label.
- Sender-based rules.
- Keyword-based rules.
- Attachment-based rules.

### 11.5 Outbound Identity

Fitur:

- SMTP credentials mapping.
- Send-as setup guide for Gmail.
- DKIM status.
- SPF alignment status.
- DMARC alignment status.
- Test send.
- Delivery log.

### 11.6 Audit Log

Fitur untuk owner:

- Login events.
- Alias created/deleted.
- Routing changed.
- DNS changed detected.
- SMTP credential added/rotated.
- Backup exported.
- AI access enabled/disabled.

Tidak wajib ditampilkan ke team member.

### 11.7 Backup & Export

Fitur:

- Export config JSON.
- Export aliases CSV.
- Export audit logs.
- Export provider settings snapshot.
- Optional encrypted backup to S3-compatible storage.

MVP tidak perlu backup full email body jika email tetap disimpan di Gmail/provider.

### 11.8 AI Features

Prioritas AI:

1. Daily digest.
2. Urgent detection.
3. Auto-label recommendation.
4. Phishing/spam scoring.
5. Draft reply assistant.
6. Semantic search.
7. Invoice/receipt extraction.

Privacy requirement:

- AI off by default untuk body email.
- Per-alias AI permission.
- Per-mailbox AI permission.
- “Never AI process” labels untuk `admin@`, `security@`, `billing@`.

### 11.9 Newsletter / Campaign Lite

Fitur:

- Audience list.
- Import CSV.
- Tags/segments.
- Template editor.
- Unsubscribe management.
- Suppression list.
- Bounce tracking.
- Rate limit.
- Marketing subdomain.

MVP boleh hanya integrasi Mailtrap, bukan membangun campaign engine penuh.

---

## 12. Recommended Tech Stack

### 12.1 Frontend

Rekomendasi:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query.
- React Hook Form + Zod.

Alasan:

- Cepat untuk dashboard modern.
- Cocok untuk AI coding agent.
- Mudah dikembangkan menjadi SaaS.

### 12.2 Backend

Rekomendasi:

- Next.js API Routes/Server Actions untuk MVP.
- Atau NestJS/Fastify jika backend dipisah.
- TypeScript end-to-end.
- REST API untuk awal, dengan opsi tRPC internal.

### 12.3 Database

Rekomendasi:

- PostgreSQL.
- Prisma ORM atau Drizzle ORM.
- Redis untuk queue/cache/rate limit.

### 12.4 Queue & Jobs

Rekomendasi:

- BullMQ + Redis.
- Alternatif: Inngest / Trigger.dev jika ingin developer-friendly.

Job examples:

- DNS verification periodic.
- Delivery webhook processing.
- AI digest generation.
- Backup export.
- Alias expiration cleanup.

### 12.5 Email Providers

MVP recommended:

- Cloudflare DNS + Email Routing/Workers untuk inbound routing.
- Mailtrap Email API/SMTP untuk outbound transactional/bulk.
- Gmail sebagai mail client.

Advanced/self-host track:

- Stalwart Mail Server untuk IMAP/JMAP/SMTP lab.
- SimpleLogin-compatible architecture untuk alias privacy.

### 12.6 AI

Rekomendasi:

- OpenAI-compatible API abstraction.
- Local LLM optional untuk privacy mode.
- Embeddings optional untuk semantic search.
- pgvector jika semantic search diaktifkan.

### 12.7 Infrastructure

Karena VPS sudah ada:

- Docker Compose untuk MVP.
- Nginx atau Caddy sebagai reverse proxy.
- PostgreSQL container atau managed jika nanti ada budget.
- Redis container.
- Backup ke object storage.
- Uptime monitoring.

### 12.8 Observability

- OpenTelemetry-compatible logging.
- Grafana + Prometheus optional.
- Sentry untuk frontend/backend errors.
- Healthcheck endpoint.

---

## 13. Data Model Draft

### 13.1 users

```sql
id uuid primary key
email text unique not null
name text
role text check (role in ('owner', 'admin', 'member'))
status text check (status in ('active', 'invited', 'disabled'))
created_at timestamptz
updated_at timestamptz
```

### 13.2 domains

```sql
id uuid primary key
domain text unique not null
status text
provider text
is_primary boolean default false
created_at timestamptz
updated_at timestamptz
```

### 13.3 mailboxes

```sql
id uuid primary key
domain_id uuid references domains(id)
local_part text not null
address text unique not null
owner_user_id uuid references users(id)
inbox_destination text
send_enabled boolean default false
receive_enabled boolean default true
status text
created_at timestamptz
updated_at timestamptz
```

### 13.4 aliases

```sql
id uuid primary key
domain_id uuid references domains(id)
local_part text not null
address text unique not null
destination_mailbox_id uuid references mailboxes(id)
type text check (type in ('custom', 'service', 'disposable', 'catch_all_generated'))
status text check (status in ('active', 'disabled', 'expired', 'quarantined'))
expires_at timestamptz
notes text
tags text[]
created_by uuid references users(id)
created_at timestamptz
updated_at timestamptz
```

### 13.5 routing_rules

```sql
id uuid primary key
alias_id uuid references aliases(id)
action text check (action in ('forward', 'quarantine', 'drop', 'worker', 'label'))
condition_json jsonb
destination_json jsonb
priority int default 100
enabled boolean default true
created_at timestamptz
updated_at timestamptz
```

### 13.6 email_events

```sql
id uuid primary key
provider text
event_type text
message_id text
from_address text
to_address text
alias_id uuid references aliases(id)
mailbox_id uuid references mailboxes(id)
subject_hash text
metadata jsonb
created_at timestamptz
```

### 13.7 audit_logs

```sql
id uuid primary key
actor_user_id uuid references users(id)
action text not null
resource_type text
resource_id text
ip_address inet
user_agent text
metadata jsonb
created_at timestamptz
```

### 13.8 ai_preferences

```sql
id uuid primary key
user_id uuid references users(id)
mailbox_id uuid references mailboxes(id)
ai_body_access boolean default false
ai_metadata_access boolean default true
daily_digest_enabled boolean default false
phishing_score_enabled boolean default false
created_at timestamptz
updated_at timestamptz
```

---

## 14. API Spec Draft

### 14.1 Auth

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/invite/accept
```

### 14.2 Domains

```http
GET /api/domains
POST /api/domains
GET /api/domains/:id/dns-health
POST /api/domains/:id/verify
```

### 14.3 Mailboxes

```http
GET /api/mailboxes
POST /api/mailboxes
GET /api/mailboxes/:id
PATCH /api/mailboxes/:id
DELETE /api/mailboxes/:id
```

### 14.4 Aliases

```http
GET /api/aliases
POST /api/aliases
GET /api/aliases/:id
PATCH /api/aliases/:id
DELETE /api/aliases/:id
POST /api/aliases/:id/disable
POST /api/aliases/:id/rotate
```

### 14.5 Routing Rules

```http
GET /api/rules
POST /api/rules
PATCH /api/rules/:id
DELETE /api/rules/:id
```

### 14.6 Webhooks

```http
POST /api/webhooks/mailtrap
POST /api/webhooks/cloudflare-email
POST /api/webhooks/inbound-worker
```

### 14.7 AI

```http
POST /api/ai/digest/run
GET /api/ai/digest/latest
POST /api/ai/classify
POST /api/ai/draft-reply
```

### 14.8 Backup

```http
POST /api/backups/export
GET /api/backups
GET /api/backups/:id/download
```

---

## 15. Security & Privacy Requirements

### 15.1 Authentication

- Owner account must support 2FA.
- Team accounts should support 2FA.
- Magic link boleh untuk MVP, tetapi owner harus punya stronger auth.
- Session expiration configurable.

### 15.2 Authorization

Roles:

- Owner: full access.
- Admin: manage team/aliases but no critical secrets by default.
- Member: view own mailbox/alias only.

### 15.3 Secrets Management

- API keys encrypted at rest.
- SMTP password never shown after creation.
- Support key rotation.
- Store secrets outside plain database when possible.

### 15.4 Encryption

Email reality:

- SMTP email biasa tidak otomatis end-to-end encrypted.
- Gmail + forwarding tidak memberikan E2EE penuh antar semua pengirim/penerima.
- E2EE penuh lebih realistis jika memakai PGP/S/MIME atau provider privacy-first seperti Proton untuk mailbox tertentu.

Recommended policy:

- Gunakan TLS untuk transport.
- Gunakan encryption at rest untuk database dan backup.
- Gunakan PGP/S/MIME untuk komunikasi sangat sensitif.
- Pisahkan mailbox sensitif: `security@`, `admin@`, `billing@`.
- Nonaktifkan AI body access untuk mailbox sensitif.

### 15.5 Audit Log

Audit wajib untuk owner:

- Login.
- Failed login.
- Create/delete alias.
- Change routing.
- API key changes.
- Backup export.
- AI access changes.

### 15.6 Abuse Protection

- Rate limit dashboard API.
- Rate limit alias creation.
- Block disposable alias abuse.
- Validate sender domain alignment.
- Maintain suppression list untuk newsletter.

---

## 16. Deliverability Strategy

### 16.1 DNS Records

Minimum:

- MX untuk inbound.
- SPF untuk outbound providers.
- DKIM untuk outbound signing.
- DMARC untuk policy/reporting.

Recommended DMARC rollout:

1. `p=none` untuk observasi.
2. `p=quarantine` setelah valid.
3. `p=reject` setelah semua source align.

### 16.2 Subdomain Strategy

Karena domain utama dipakai landing page dan harus dijaga reputasinya:

| Use case | Domain/subdomain | Alasan |
|---|---|---|
| personal/team email | `freakyswan.my.id` | identitas utama |
| transactional app email | `notify.freakyswan.my.id` | pisah dari personal |
| newsletter/marketing | `updates.freakyswan.my.id` | lindungi reputasi root domain |
| experiments | `labs.freakyswan.my.id` | isolasi risiko |

### 16.3 Sending Warmup

Untuk volume sedang-banyak:

- Mulai kirim sedikit dulu.
- Hindari cold blast dari domain baru.
- Pisahkan newsletter dari personal email.
- Monitor bounce rate.
- Gunakan unsubscribe link.
- Jangan beli list email.

---

## 17. Provider Strategy

### 17.1 Cloudflare

Peran:

- DNS authoritative.
- Email routing.
- Email Workers untuk custom inbound logic.
- Analytics dasar.

Cocok untuk:

- Alias routing gratis.
- Catch-all.
- Worker-based filtering.

Batasan:

- Forwarding bukan mailbox penuh.
- Outbound historically perlu provider lain.
- Untuk fitur terbaru Cloudflare Email Service, perlu validasi implementasi saat development.

### 17.2 Gmail

Peran:

- Client harian.
- Inbox UX.
- Search dan mobile app.

Cocok untuk:

- Kebiasaan penggunaan kamu.
- Team yang sudah familiar Gmail.

Batasan:

- Bukan open-source.
- E2EE penuh tidak native untuk semua email.
- Send-as membutuhkan SMTP provider.

### 17.3 Mailtrap

Peran:

- SMTP/API outbound.
- Transactional email.
- Bulk/newsletter future.
- Logs, analytics, webhooks, suppression.

Cocok untuk:

- Developer workflow.
- Product/SaaS future.

Batasan:

- Free plan mungkin terbatas.
- Untuk volume besar mungkin butuh paid tier.

### 17.4 Stalwart Mail Server

Peran:

- Open-source self-host mail/collaboration server candidate.
- Phase 2 atau lab environment.

Cocok untuk:

- Kontrol penuh.
- IMAP/JMAP/SMTP.
- Alias/catch-all/open-source stack.

Batasan:

- Deliverability VPS tetap tantangan.
- Butuh monitoring, backup, spam filtering, abuse handling.

---

## 18. MVP Scope

### 18.1 MVP Must-Have

1. Dashboard login owner.
2. Domain setup wizard.
3. DNS health checker.
4. Mailbox identity management.
5. Alias management.
6. Forwarding destination management.
7. Catch-all quarantine.
8. SMTP/send-as setup guide.
9. Mailtrap outbound integration.
10. Delivery/webhook event log.
11. Audit log owner.
12. Backup/export config.
13. Basic AI daily digest opt-in.

### 18.2 MVP Should-Have

1. Team invite.
2. Role-based access.
3. Alias tags/notes.
4. Disposable alias.
5. Blocklist/allowlist.
6. Gmail setup checklist.
7. DMARC report parser basic.
8. Notification via Telegram/Discord/Slack optional.

### 18.3 MVP Nice-to-Have

1. Semantic search.
2. AI draft reply.
3. CRM-lite.
4. Newsletter campaign editor.
5. Multi-domain support.
6. Public SaaS onboarding.

---

## 19. Detailed Product Screens

### 19.1 Dashboard Home

Cards:

- Domain health.
- Active mailboxes.
- Active aliases.
- Emails routed today.
- Outbound delivery status.
- Security alerts.
- AI digest summary.

### 19.2 Domain Setup

Sections:

- Nameserver status.
- MX status.
- SPF status.
- DKIM status.
- DMARC status.
- Provider integrations.
- Copy DNS record buttons.

### 19.3 Mailboxes

Table columns:

- Address.
- Owner.
- Destination inbox.
- Send enabled.
- Receive enabled.
- Status.
- Last activity.

### 19.4 Aliases

Table columns:

- Alias address.
- Type.
- Destination.
- Tags.
- Status.
- Created by.
- Last used.

Actions:

- Create alias.
- Disable.
- Rotate.
- Convert quarantine to alias.
- Export CSV.

### 19.5 Routing Rules

Visual rule builder:

- If recipient equals...
- If sender contains...
- If subject contains...
- If attachment exists...
- Then forward/quarantine/drop/label/summarize.

### 19.6 Logs

Tabs:

- Inbound events.
- Outbound events.
- Bounce events.
- Audit logs.
- AI logs.

Filters:

- mailbox;
- alias;
- date;
- event type;
- provider;
- status.

### 19.7 AI Center

Sections:

- Daily digest settings.
- Mailbox permissions.
- Sensitive aliases excluded.
- Recent summaries.
- Draft assistant.
- Phishing scanner.

### 19.8 Backup Center

Sections:

- Manual export.
- Scheduled backup.
- Backup destination.
- Restore instructions.
- Last backup status.

---

## 20. User Stories & Acceptance Criteria

### Story 1 — Create a Professional Mailbox

As owner, I want to create `founder@freakyswan.my.id` so I can use it as my main professional identity.

Acceptance criteria:

- Owner can create mailbox identity from dashboard.
- System validates local-part availability.
- System creates routing/send config or provides setup instructions.
- Mailbox appears active after test receive/send succeeds.

### Story 2 — Create Service Alias

As owner, I want to create `github@freakyswan.my.id` so I can track account-specific leaks.

Acceptance criteria:

- Alias can be assigned to owner inbox.
- Alias can be tagged `service` and `important`.
- Alias can be disabled without deleting history.
- Events for alias appear in logs.

### Story 3 — Team Member Email

As owner, I want to invite a team member and assign them an email identity.

Acceptance criteria:

- Invite email is sent.
- Team member can accept invite.
- Owner can assign mailbox.
- Team member sees only own mailbox/alias.

### Story 4 — Catch-All Quarantine

As owner, I want unknown addresses to go to quarantine so catch-all does not flood my inbox.

Acceptance criteria:

- Unknown recipient does not directly forward to inbox.
- Owner can approve/drop/block.
- Approved address becomes alias.

### Story 5 — Send from Gmail

As team member, I want to send from `name@freakyswan.my.id` inside Gmail.

Acceptance criteria:

- Dashboard provides SMTP settings.
- Test send passes SPF/DKIM/DMARC alignment.
- User can see delivery event in dashboard if provider supports webhook.

### Story 6 — AI Digest

As owner, I want a daily summary of important emails.

Acceptance criteria:

- AI digest is opt-in.
- Sensitive mailboxes are excluded by default.
- Digest groups urgent, needs reply, invoice, newsletter.
- User can disable AI access anytime.

---

## 21. AI Coding Agent Implementation Notes

The AI coding agent should implement this project as a modular monorepo.

Suggested structure:

```txt
freakyswan-mail-os/
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

Provider abstraction:

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

Do not hardcode Cloudflare/Mailtrap deeply into business logic. Put them behind provider adapters.

---

## 22. Implementation Roadmap

### Phase 0 — Research & Setup

- Move DNS to Cloudflare if acceptable.
- Confirm VPS IP reputation.
- Confirm Mailtrap free tier limits.
- Create Cloudflare API token.
- Create Mailtrap account and verify domain/subdomain.

### Phase 1 — Email Foundation

- Configure MX/SPF/DKIM/DMARC.
- Setup default addresses.
- Setup Gmail send-as via SMTP.
- Setup Mailtrap outbound.
- Setup routing for owner.
- Test send/receive.

### Phase 2 — Dashboard MVP

- Auth.
- Domain model.
- Mailbox model.
- Alias model.
- DNS health checker.
- Audit log.
- Backup export.

### Phase 3 — Routing Automation

- Cloudflare provider adapter.
- Alias create/disable sync.
- Catch-all quarantine.
- Rules engine.
- Webhook ingestion.

### Phase 4 — Team & Security

- Team invite.
- RBAC.
- 2FA.
- Secret rotation.
- Owner-only audit view.

### Phase 5 — AI Layer

- AI preferences.
- Daily digest.
- Urgency detection.
- Phishing score.
- Draft reply assistant.

### Phase 6 — Newsletter/Marketing

- Marketing subdomain.
- Mailtrap bulk stream.
- Audience list.
- Unsubscribe.
- Suppression.
- Campaign logs.

### Phase 7 — SaaS Readiness

- Multi-tenant workspace.
- Billing.
- Public onboarding.
- Domain verification self-service.
- Rate limits per tenant.
- Abuse monitoring.

---

## 23. Launch Checklist

### DNS

- [ ] MX configured.
- [ ] SPF includes all outbound senders.
- [ ] DKIM active for outbound provider.
- [ ] DMARC starts at `p=none`.
- [ ] Marketing subdomain separated.
- [ ] Test SPF/DKIM/DMARC alignment.

### Security

- [ ] Owner 2FA enabled.
- [ ] API keys encrypted.
- [ ] Backup encryption enabled.
- [ ] Sensitive aliases excluded from AI.
- [ ] Audit log enabled.

### Product

- [ ] Default mailboxes created.
- [ ] Alias creation works.
- [ ] Catch-all quarantine works.
- [ ] Gmail send-as guide tested.
- [ ] Test inbound and outbound success.

### Ops

- [ ] Uptime monitor active.
- [ ] Backup schedule active.
- [ ] Error logging active.
- [ ] Provider webhook configured.
- [ ] Restore process documented.

---

## 24. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---:|---|
| VPS IP masuk blacklist | email outbound masuk spam | gunakan outbound provider seperti Mailtrap untuk MVP |
| Forwarded email gagal DMARC | inbound hilang/ditolak | gunakan provider routing yang memahami forwarding; monitor failures |
| Free tier limit habis | email gagal terkirim | rate limit, alert, fallback provider |
| AI membaca email sensitif | privacy breach | opt-in, exclude sensitive aliases, metadata-only default |
| Catch-all kebanjiran spam | inbox penuh | quarantine default, blocklist, rules |
| Newsletter merusak reputasi domain | personal email masuk spam | pakai subdomain marketing terpisah |
| Self-host downtime | email hilang/tertunda | jangan jadikan self-host server utama di MVP |
| API token bocor | domain/routing takeover | encrypt secrets, rotate keys, least privilege token |

---

## 25. Metrics

### Product Metrics

- Number of active mailboxes.
- Number of active aliases.
- Alias creation frequency.
- Catch-all quarantine approval rate.
- Team activation completion rate.

### Email Metrics

- Delivery rate.
- Bounce rate.
- Spam complaint rate.
- DMARC pass rate.
- DKIM pass rate.
- SPF pass rate.

### Security Metrics

- Failed login attempts.
- 2FA adoption.
- API key rotation age.
- Sensitive alias AI exclusion status.

### AI Metrics

- Digest open rate.
- User feedback on digest usefulness.
- Draft acceptance rate.
- False positive urgency rate.

---

## 26. Final Recommendation

### Best Practical Path for FreakySwan

1. **Use Cloudflare as DNS authority** for `freakyswan.my.id` while keeping landing page intact via A/CNAME records.
2. **Set up inbound routing** using Cloudflare Email Routing/Workers.
3. **Use Gmail as daily email client** because kamu nyaman dengan Gmail.
4. **Use Mailtrap for outbound SMTP/API**, especially transactional and future newsletter.
5. **Separate newsletter to subdomain**, e.g. `updates.freakyswan.my.id`.
6. **Build custom dashboard** on your VPS for alias/rules/logs/AI/audit/backup.
7. **Do not self-host full primary mail server in MVP** unless kamu siap menangani deliverability, blacklist, spam, monitoring, dan backup secara serius.
8. **Experiment with Stalwart** as Phase 2 lab untuk open-source full mail stack.
9. **Treat E2EE as tiered security**, not absolute for all email: use PGP/S/MIME or privacy-first mailbox for sensitive communication, and disable AI for sensitive aliases.

### Recommended MVP Name

**FreakySwan Mail OS**

Alternative names:

- SwanMail Control
- FreakyMail Console
- SwanInbox OS
- SwanRelay
- MailSwan

Best fit for tech/startup premium: **FreakySwan Mail OS**.

---

## 27. Appendix — Initial Default Configuration

### Default Mailboxes

```txt
founder@freakyswan.my.id
hello@freakyswan.my.id
team@freakyswan.my.id
support@freakyswan.my.id
admin@freakyswan.my.id
billing@freakyswan.my.id
security@freakyswan.my.id
```

### Default Alias Tags

```txt
personal
business
team
service
billing
security
newsletter
temporary
high-risk
ai-disabled
```

### Default Sensitive Addresses

```txt
admin@freakyswan.my.id
security@freakyswan.my.id
billing@freakyswan.my.id
cloudflare@freakyswan.my.id
github@freakyswan.my.id
bank@freakyswan.my.id
```

### Default DMARC Rollout

```txt
Week 1-2: p=none
Week 3-4: p=quarantine for subdomains first
After stable: p=reject for selected domains/subdomains
```

---

## 28. Open Questions for Next Revision

1. Apakah kamu bersedia memindahkan nameserver domain dari Sumopod/VPS DNS ke Cloudflare?
2. Apakah tiap team member sudah punya Gmail pribadi/workspace masing-masing sebagai destination inbox?
3. Apakah outbound personal email harus gratis total, atau boleh memakai free tier provider dengan limit?
4. Apakah kamu ingin dashboard ini open-source publik sejak awal atau private dulu?
5. Apakah AI akan menggunakan cloud model atau local model untuk privacy mode?
6. Apakah kamu ingin menerima email body di dashboard, atau hanya metadata/logs?
7. Apakah newsletter akan dimulai dari audience kecil atau langsung skala besar?

