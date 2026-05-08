# Soft Premium UI/UX Design

## Goal

Refresh SwanMail MVP frontend into a simple, clear, soft-premium admin experience across all current pages.

The design should make domain, mailbox, alias, routing, and log status easy to understand at a glance without expanding product scope or adding a new UI framework.

## Scope

Update these existing surfaces:

- Login page
- Dashboard shell and navigation
- Dashboard home
- Domains page
- Mailboxes page
- Aliases page
- Rules page
- Logs page
- Settings page

Do not add new product features beyond present data/actions. The work is visual hierarchy, layout, component consistency, empty states, and page clarity.

## Visual Direction

Use a **Soft Ops Console** direction:

- Dark slate base remains.
- Panels become slightly softer and more premium with layered slate surfaces, thin borders, and restrained shadows.
- Use one primary accent: muted cyan/teal.
- Keep typography straightforward and readable.
- Create polish through spacing, hierarchy, and consistent components, not decorative noise.
- Overall feel: private email control panel, not developer demo.

Status colors:

- `success` / verified / active: emerald
- `warning` / degraded / attention needed: amber
- `neutral` / pending: slate
- `danger` / disabled / destructive: rose
- `info` / manual guidance: cyan

## Shared UI Patterns

Introduce small reusable UI pieces only when they remove duplication and clarify intent:

- `PageHeader`: title, description, optional action area.
- `StatCard`: label, value, optional helper/status.
- `StatusBadge`: maps statuses to consistent colors.
- `EmptyState`: title, description, optional action.
- `SectionCard`: optional wrapper around existing `Card` if repeated page sections need a consistent header/action layout.

Keep existing server-page data fetching. Avoid client state unless a page already needs it. Keep Tailwind CSS and existing component style.

## Page Structure

Each MVP page should follow this order when applicable:

1. Page header with clear title and one-line purpose.
2. Summary cards for total, active, pending, or attention-needed counts.
3. Main list/table/cards with clear status badges and minimal row actions.
4. Helpful empty state when no data exists.
5. Forms with labels, helper text, and accessible focus states.

Mobile and narrow layouts should stack cleanly and avoid horizontal overflow. Full sidebar collapse is not required for this pass.

## Page-by-Page Design

### Login

- Keep minimal owner login flow.
- Use a refined sign-in card with SwanMail / FreakySwan Mail OS identity.
- Add short trust-focused copy such as private email control plane.
- Preserve existing login action behavior.

### Dashboard Shell

- Keep left navigation on desktop.
- Improve spacing, active state, and user/email display.
- Navigation should clearly show current area.
- Preserve sign-out placement and behavior.

### Dashboard Home

- Show high-level operational state using `StatCard` grid:
  - domains
  - mailboxes
  - aliases
  - email events
  - audit logs
- Add an attention-needed summary using existing counts/statuses where available.
- Add quick links/actions for common next steps: domains, mailboxes, aliases.

### Domains

- Keep domain setup wizard behavior.
- Make Cloudflare configured/not-configured state easy to see.
- Keep selected domain DNS table.
- Domain list cards should show status and per-domain `Check DNS` / `Apply fixes` actions.
- Preserve current domain create/check/apply server actions.

### Mailboxes

- Show mailbox identities with address, destination inbox, send/receive flags, and status.
- Add empty state explaining that mailboxes are identities routed to destination inboxes.
- Keep create/manage actions visually reserved even if not fully implemented yet.

### Aliases

- Show alias address, type, destination, tags, and status.
- Highlight service/catch-all-related aliases with clear chips.
- Add empty state explaining aliases as safer public-facing addresses.

### Rules

- Show routing rules as a priority-ordered list.
- Make action type visually obvious: forward, quarantine, drop, worker, label.
- Empty state should recommend catch-all quarantine as safe default.

### Logs

- Keep audit logs and email events as separate sections.
- Improve empty states and compact readability.
- Do not add filtering in this pass unless it is already trivial and low-risk.

### Settings

- Organize into section cards:
  - Security
  - Provider config
  - Backup/export
  - AI preferences
- Use placeholders only when backed by current MVP direction, not as fake controls.

## Accessibility Requirements

- Every input has a visible label or screen-reader-only label.
- Buttons use clear action text.
- Status badges must not rely on color alone when meaning matters; visible text remains required.
- Focus styles remain visible.
- Tables/lists avoid horizontal overflow on narrow screens.

## Error and Empty States

- Empty states should explain what the page manages and provide a next action if available.
- Existing server action failure behavior remains unchanged unless UI text can clarify it without new backend work.
- Do not introduce toast systems or client-side error frameworks in this pass.

## Verification

Run:

```powershell
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
```

Browser smoke:

1. Login page loads and login still works.
2. Dashboard loads.
3. Domains, Mailboxes, Aliases, Rules, Logs, Settings pages load.
4. Domain setup wizard remains visible.
5. Add-domain form remains accessible.
6. Layout has no obvious horizontal overflow on desktop and a narrow viewport.

## Non-Goals

- No new product capabilities.
- No new UI library.
- No full responsive sidebar redesign.
- No theme switcher.
- No data model changes.
- No provider integration changes.
