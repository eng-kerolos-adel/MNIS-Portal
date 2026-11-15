# MNIS — National Unified Medical Identity System
### Clinical & Hospital Operations Portal (Next.js)

A production-structured Next.js 15 / React 19 / Tailwind CSS v4 web application implementing the **MNIS "Clinical Clarity & Civic Trust"** design system across five role-based portals:

| Portal | Live screens |
|---|---|
| **Physician** (`/doctor`) | Clinic Queue & Patient Lookup · Active Consultation & E-Prescription |
| **Pharmacy** (`/pharmacy`) | Dispensing Queue · Rx Verification |
| **Laboratory** (`/lab`) | Sample Intake & Lab Queue · Results Entry & Verification |
| **Hospital Operations** (`/hospital`) | ER Intake & Clinical Triage · Bed & ICU Capacity Management |
| **Sovereign Analytics** (`/analytics`) | Executive Command Overview (live figures from the API) |
| **Reception** (`/reception`) | Open citizen accounts · Confirm/reject appointment requests |
| **Admin** (`/admin`) | Staff accounts: create, disable, reset password |

The physician portal also has **Renewal Requests** (from the citizen app) and **Shared Patient Record** (redeem a citizen's one-time QR code).

Every other item in each portal's sidebar is wired to a real route with a clearly labeled placeholder screen (`ModuleStub`) rather than a dead link, so the navigation is complete even though this delivery focuses full interactivity on the nine screens above.

## Stack

- **Next.js 15** (App Router, React Server + Client Components)
- **React 19**
- **TypeScript**, strict mode
- **Tailwind CSS v4** — CSS-variable-driven design tokens (see `src/app/globals.css`) for full light/dark theming without duplicated utility classes
- **next-themes** for persisted light/dark mode
- **lucide-react** for iconography (bundled, no runtime font/network dependency)
- **next/font** (Inter + Cairo) — self-hosted at build time, zero runtime requests to Google Fonts

The portal is wired to the **MNIS API** (`mnis-api`). `src/lib/data/service.ts` calls the API and maps its responses into the bilingual domain types the screens use; `src/lib/api/client.ts` handles the access token (kept in memory only) and silent refresh.

## Connecting to the API
1. Deploy `mnis-api` first (see its README) and note its URL.
2. Create `.env.local` in this project: `API_URL=https://your-api.onrender.com` (local API: `http://localhost:3001`).
3. The browser only ever calls same-origin `/v1/*`; `next.config.mjs` proxies it to `API_URL`. That keeps the httpOnly refresh cookie first-party (works in Safari), removes CORS, and hides the API host.
4. On Vercel, set the same `API_URL` env var. On the API set `TRUST_PROXY_HOPS=2` (Vercel → Render), otherwise every user shares one rate-limit bucket.
5. Render's free tier sleeps: the first request after a pause can take 30–60 s (or time out through the proxy). Just retry; ping `/health` if you're demoing.

Sign-in is by staff email + password. Accounts are created by an admin (`admin@mnis.demo` after seeding); new accounts must change their temporary password on first sign-in. Citizens use the mobile app, not this portal.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build && npm run start   # production build
npm run typecheck                # tsc --noEmit
```

> This project was authored in a sandboxed environment without package-registry access, so `npm install` has not been run or verified here. The code follows current Next.js 15 / Tailwind v4 / React 19 conventions, but please run a local `npm install && npm run build` after downloading and report anything that needs a tweak — dependency APIs occasionally shift between minor releases.

## Internationalization & RTL

- Arabic and English are both first-class: content-level data (patient names, diagnoses, medication names, etc.) is stored as `{ en, ar }` pairs in `src/types/domain.ts` / `src/lib/data/mock.ts`, not just UI chrome.
- Shared UI strings live in `src/lib/i18n/translations.ts`; screen-specific copy lives inline per screen (also bilingual).
- `src/lib/i18n/LocaleProvider.tsx` toggles `<html lang>` / `<html dir>` at runtime (persisted to `localStorage`) — no page reload, no routing change.
- Layout uses Tailwind's logical-property utilities (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `rtl:`) throughout, so the entire UI mirrors correctly in RTL rather than needing separate Arabic/English layouts.

## Theming

Light and dark tokens are defined once as CSS custom properties in `globals.css` and mapped into Tailwind's `@theme inline` block, so every `bg-primary`, `text-on-surface`, etc. utility is theme-aware automatically. Toggle via the header's sun/moon control (persisted via `next-themes`).

## Project structure

```
src/
  app/                    Routes (App Router) — one folder per portal
    doctor/ pharmacy/ lab/ hospital/ analytics/
  components/
    layout/               AppShell, Sidebar, Header, Footer, PageHeader
    ui/                   Button, Badge, Card, Modal, Tabs, StatCard, …
    charts/               Sparkline, DonutRing (dependency-free inline SVG)
    modules/               ModuleStub (placeholder screens)
  lib/
    data/                 mock.ts (seed data), service.ts (mock API layer)
    i18n/                 translations.ts, LocaleProvider.tsx
    toast/                Toast notification system
    nav.ts                Per-portal navigation configuration
    utils/                cn (class merge), format (locale-aware numbers/dates)
  types/domain.ts         Shared TypeScript domain models
```

## Known trade-offs in this delivery

- **9 screens are fully interactive**; the remaining sidebar items are on-brand placeholders (`ModuleStub`) — extending them to full screens is mostly a matter of copying the pattern of an existing flagship screen against new mock data.
- Not yet built: MFA, password reset by email, ER intake form (cases come from seed data or the API), appointment/lab ordering screens for doctors, automated tests. The 22 placeholder modules remain placeholders.
- The prescription "signature" is a server-side integrity seal, not a qualified PKI e-signature.
- Patient/staff portraits are hotlinked from the original design system's asset URLs (Google-hosted) — swap `PORTRAITS` in `src/lib/assets.ts` for your own asset pipeline before production use.
