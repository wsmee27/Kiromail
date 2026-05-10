# SwanMail Implementation Plan

This document tracks the execution of the SwanMail MVP based on the PRD and architecture guidelines.

## Current Status Overview
The project is currently in the **Foundation & UI Scaffolding** stage. The database schema, authentication system, and frontend dashboard interfaces have been built. The application logic is currently operating on internal state (database) but is not yet synchronized with external email providers (Cloudflare / Mailtrap).

> **Next steps are tracked in detail in `docs/superpowers/plans/2026-05-10-kiromail-improvement-roadmap.md`** — it contains the 5-sprint improvement roadmap (hardening, Cloudflare integration, Mailtrap + webhooks, worker/backup/invite, CI & deploy) plus the target file structure, flow diagrams, and acceptance criteria. Keep Phase 5+ checkboxes below in sync with that plan.

---

## ✅ Completed Phases

### Phase 1: Core Foundation
- [x] Scaffold Next.js 15 App Router project.
- [x] Configure Tailwind CSS v4 and styling architecture (`globals.css`, fonts, colors).
- [x] Set up PostgreSQL database via Docker Compose (`infra/docker-compose.yml`).
- [x] Set up Prisma ORM and apply initial migrations.

### Phase 2: Authentication & Security
- [x] Implement lightweight, secure cookie sessions using `iron-session`.
- [x] Create owner authentication flow (`/login`) with `bcrypt` password hashing.
- [x] Add session validation logic (`requireOwner`) for dashboard protection.
- [x] Implement Audit Logging mechanism (`createAuditLog`).

### Phase 3: Database Schema
- [x] `User`, `AiPreference` (Owner & Security)
- [x] `Domain`, `Mailbox`, `Alias` (Identities & Routing)
- [x] `RoutingRule`, `EmailEvent` (Rules & Monitoring)
- [x] `AuditLog` (Security trail)

### Phase 4: Dashboard UI Scaffolding
- [x] Build reusable UI components (`Card`, `StatusBadge`, `PageHeader`, `SectionCard`).
- [x] Create Dashboard overview page with statistics.
- [x] Implement Domains management page.
- [x] Implement Mailboxes management page.
- [x] Implement Aliases management page.
- [x] Implement Rules and Logs viewing pages.

---

## 🚧 Upcoming Phases (To Do)

### Phase 5: Provider Adapters (Cloudflare & Mailtrap)
*The system needs to communicate with external APIs to actually route emails.*
- [ ] Create `packages/email-providers` or `lib/providers/` directory.
- [ ] Implement **Cloudflare Adapter**:
  - Fetch DNS records to verify domain health.
  - Create/Delete Custom Email Addresses (Mailboxes).
  - Create/Delete Routing Rules (Aliases).
- [ ] Implement **Mailtrap Adapter**:
  - Fetch sending domain verification status.
  - Retrieve SMTP credentials for the UI.

### Phase 6: Action Synchronization
*Connect the UI forms to the newly created Provider Adapters.*
- [ ] Update `createMailboxAction` to provision the mailbox on Cloudflare.
- [ ] Update `disableMailboxAction` to remove/disable the routing rule on Cloudflare.
- [ ] Update Alias creation/deletion to sync with Cloudflare.
- [ ] Build the **DNS Health Checker** button in the Domains UI to verify records dynamically.

### Phase 7: Webhooks & Event Logs
*Capture live data from email activities.*
- [ ] Create a webhook endpoint (e.g., `app/api/webhooks/mailtrap/route.ts`) to receive delivery statuses (bounces, delivered, spam).
- [ ] Save incoming webhooks to the `EmailEvent` table.
- [ ] Create a webhook endpoint for Cloudflare Workers (if handling custom drop/quarantine logic).

### Phase 8: SMTP Guide & Final Polish
*Help the user actually use the system with their daily driver (Gmail).*
- [ ] Build a "Send-As Setup Guide" UI in the dashboard showing exactly how to configure Gmail with the generated Mailtrap SMTP credentials.
- [ ] Implement the Catch-all Quarantine logic (Phase 2 feature, but good to set up basic UI now).
- [ ] End-to-end testing of mail flow (Inbound -> Cloudflare -> Gmail, Outbound -> Gmail -> Mailtrap -> Destination).
