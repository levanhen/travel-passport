# Travel Passport

**A digital tourism passport: travel somewhere, check in, build up a verified travel history, and unlock local perks.**

Travel Passport is an open-source platform for tourism check-ins and loyalty. Tourists check in at sites using GPS, QR codes, and photos. Each check-in earns points, levels, and badges, and those unlock vouchers that local merchants redeem at the counter. Site operators and tourism authorities manage everything from a back office.

This repository holds **MVP 1**, a modular monolith that runs the whole loop for one destination. The reference pilot is Đà Nẵng, Vietnam.

```text
Tourist signs up → checks in (GPS / QR / photo) → earns points + badges
        → reaches level/points threshold → claims voucher → merchant redeems it
```

> **Tourism first, blockchain second.** MVP 1 runs fully off-chain. Points are not tokenized. Verifiable credentials and a blockchain trust layer are planned for later phases (see [Roadmap](#roadmap)).

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Demo accounts](#demo-accounts)
- [Scripts](#scripts)
- [API overview](#api-overview)
- [Check-in proof levels](#check-in-proof-levels)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Features

### Tourist App (`/`)

A mobile-first PWA.

- Phone number + 6-digit PIN sign-in, bound to the device. A device that is already bound logs in silently, with no SMS cost.
- Lists and detail pages for sites in the pilot destination, including "nearby" sites based on geolocation.
- **Progressive check-in.** Start with GPS inside the geofence, then scan the site's QR code, then add a photo. You have 30 minutes to add evidence after the first check-in.
- Passport: check-in history, points ledger, level, and badges.
- Vouchers: browse the vouchers you are eligible for, claim one, and show its QR or claim code at the counter.
- Profile, PIN change, consent, and legal pages (terms and privacy).

### Tourism Back Office (`/admin`)

For site operators, tourism authorities, and platform admins.

- Dashboard with check-in, user, and voucher KPIs.
- Manage sites (geofence, category, static QR), merchants, and badges.
- Review check-ins and their evidence.
- **QR kiosk** that shows a rotating, time-limited QR code at a partner site's counter.

### Merchant Portal (`/merchant`)

For merchant owners and counter staff.

- Redeem vouchers by scanning the QR code or typing the claim code, with a confirmation step.
- Redemption history.
- Voucher management and staff management (owner only).
- Business profile.

> The user interface is currently in **Vietnamese**, because it targets the Vietnam pilot. Contributions that add i18n are welcome.

---

## Architecture

```text
                 ┌────────────────────────────────────────────┐
  Browser  ───▶  │  apps/web  (Next.js 15, App Router)         │
                 │   /          Tourist App (PWA)              │
                 │   /admin     Tourism Back Office            │
                 │   /merchant  Merchant Portal                │
                 └───────────────┬────────────────────────────┘
                                 │ REST  /api/v1  (JWT + refresh cookie)
                 ┌───────────────▼────────────────────────────┐
                 │  apps/api  (NestJS 10, modular monolith)    │
                 │   auth · destinations · check-in · points   │
                 │   badges · vouchers · merchant · admin      │
                 └───────┬─────────────────────────┬──────────┘
                         │ Prisma                  │ ioredis
                 ┌───────▼────────┐        ┌───────▼────────┐
                 │ PostgreSQL 16  │        │   Redis 7      │
                 │ packages/db    │        │ QR nonces, etc │
                 └────────────────┘        └────────────────┘
```

All three web surfaces ship as a single Next.js app, separated by route. The API is one NestJS service organized into domain modules, one per business domain (identity, destinations, check-in, points, badges, vouchers, merchants).

---

## Tech stack

| Layer | Technology |
|---|---|
| Web | [Next.js 15](https://nextjs.org/) (App Router), React 19, TanStack Query, Tailwind CSS |
| API | [NestJS 10](https://nestjs.com/), class-validator, JWT (`@nestjs/jwt`), bcryptjs |
| Database | PostgreSQL 16 + [Prisma 6](https://www.prisma.io/) |
| Cache / ephemeral state | Redis 7 (ioredis) |
| Monorepo | [pnpm](https://pnpm.io/) workspaces + [Turborepo](https://turbo.build/) |
| Language | TypeScript 5 |
| Local infra | Docker Compose |

---

## Repository layout

```text
.
├── apps/
│   ├── api/                 # NestJS REST API  (@tp/api)   → :3001/api/v1
│   └── web/                 # Next.js web app  (@tp/web)   → :3000
├── packages/
│   └── db/                  # Prisma schema, migrations, seed (@tp/db)
├── scripts/                 # Helper scripts
├── docker-compose.yml       # PostgreSQL + Redis for local development
├── .env.example             # Environment variable template
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Getting started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** 9 (`corepack enable` picks up the version pinned in `package.json`)
- **Docker** + Docker Compose, for PostgreSQL and Redis

### 1. Clone and install

```bash
git clone https://github.com/levanhen/travel-passport.git
cd travel-passport
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d   # PostgreSQL on :5432, Redis on :6379
```

### 3. Configure environment

The template [`.env.example`](.env.example) contains sections for each package. Copy it to each location, then keep the relevant section in each file:

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
cp .env.example packages/db/.env      # Prisma CLI needs DATABASE_URL here
```

### 4. Set up the database

```bash
pnpm db:generate   # generate the Prisma client
pnpm db:migrate    # apply migrations
pnpm db:seed       # seed the Đà Nẵng pilot: sites, partners, merchants, vouchers, demo accounts
```

### 5. Run

```bash
pnpm dev           # web + API in parallel (Turborepo)
```

| Surface | URL |
|---|---|
| Tourist App | http://localhost:3000 |
| Tourism Back Office | http://localhost:3000/admin |
| Merchant Portal | http://localhost:3000/merchant |
| API health check | http://localhost:3001/api/v1/health |

> **Testing check-ins away from the site:** set `CHECKIN_SKIP_GEOFENCE=true` in `apps/api/.env` and `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE=true` in `apps/web/.env.local`. Check-ins will then use the site's own coordinates. **Never enable these flags in production.**

---

## Configuration

### API (`apps/api/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | – | PostgreSQL connection string |
| `REDIS_URL` | ✅ | – | Redis connection string |
| `JWT_ACCESS_SECRET` | ✅ | – | Secret for signing access tokens. Use a long random value. |
| `JWT_REFRESH_SECRET` | ✅ | – | Secret for signing refresh tokens. Use a long random value. |
| `PORT` | | `3001` | API port |
| `CORS_ORIGIN` | | `http://localhost:3000` | Allowed web origin (credentials enabled) |
| `LEGAL_POLICY_VERSION` | | – | Current terms/privacy version that users must consent to |
| `PILOT_DESTINATION_SLUG` | | `da-nang` | Destination used by the admin dashboard |
| `CHECKIN_QR_TTL_SECONDS` | | `60` | Lifetime of rotating kiosk QR codes |
| `CHECKIN_UPGRADE_WINDOW_MINUTES` | | `30` | How long after check-in a tourist can add QR or photo evidence |
| `CHECKIN_SKIP_GEOFENCE` | | `false` | **Demo only.** Skip the server-side geofence check. |
| `UPLOAD_DIR` | | `apps/api/uploads/checkin` | Where check-in photos are stored |

### Web (`apps/web/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | – | Base URL of the API, e.g. `http://localhost:3001` |
| `NEXT_PUBLIC_LEGAL_POLICY_VERSION` | | – | Must match the API's `LEGAL_POLICY_VERSION` |
| `NEXT_PUBLIC_PILOT_DESTINATION_SLUG` | | `da-nang` | Destination shown in the Tourist App |
| `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE` | | `false` | **Demo only.** Use site coordinates instead of real GPS. |

### Seed (`packages/db/.env`, optional)

| Variable | Default | Description |
|---|---|---|
| `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` | – | Creates a `platform_admin` account. Skipped if either is unset. |
| `AUTHORITY_ADMIN_EMAIL` | `authority@travelpassport.local` | Tourism authority admin email |
| `AUTHORITY_ADMIN_PASSWORD` | `123authority` | |
| `SITE_OPERATOR_PASSWORD` | `123operator` | Password for every seeded site operator |
| `MERCHANT_OWNER_PASSWORD` | `123merchant` | Password for every seeded merchant owner |
| `MERCHANT_STAFF_PASSWORD` | `123staff` | Password for every seeded merchant staff member |

---

## Demo accounts

`pnpm db:seed` creates these accounts for **local development only**:

| Role | Email | Password | Sign in at |
|---|---|---|---|
| Tourism authority admin | `authority@travelpassport.local` | `123authority` | `/admin` |
| Site operator | `operator@ngu-hanh-son.local` | `123operator` | `/admin` |
| Merchant owner | `merchant@cafe-bach-dang.local` | `123merchant` | `/merchant` |
| Merchant staff | `staff@cafe-bach-dang.local` | `123staff` | `/merchant` |

[`packages/db/prisma/seed-da-nang.ts`](packages/db/prisma/seed-da-nang.ts) lists more operators and merchants. Tourists register themselves in the Tourist App with any phone number and a 6-digit PIN. No SMS is sent in MVP 1.

> ⚠️ Change or override every seeded password before deploying anywhere public.

---

## Scripts

Run these from the repository root:

| Command | Description |
|---|---|
| `pnpm dev` | Run web and API together (Turborepo) |
| `pnpm dev:web` | Run only the Next.js app |
| `pnpm dev:api` | Run only the NestJS API |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Run `prisma migrate dev` |
| `pnpm db:seed` | Seed the Đà Nẵng pilot data |

---

## API overview

All endpoints live under `/api/v1`. Authentication uses a short-lived access JWT (`Authorization: Bearer …`) and a rotating HttpOnly refresh cookie. Errors share one JSON shape, `{ "error": { "code", "message", "details" } }`. List endpoints accept `?page=` and `?limit=` (max 50).

| Area | Prefix | Audience |
|---|---|---|
| Tourist auth | `/auth/tourist` | Tourist (phone + PIN + device) |
| Staff auth | `/auth` | Staff (email + password) |
| Destinations & sites | `/destinations`, `/sites` | Public / tourist |
| Check-ins | `/check-ins` | Tourist |
| Points | `/points` | Tourist |
| Badges | `/badges` | Tourist |
| Vouchers | `/vouchers` | Tourist |
| Profile | `/profile` | Tourist |
| Merchant portal | `/merchant/*` | `merchant_owner`, `merchant_staff` |
| Back office | `/admin/*` | `site_operator`, `authority_admin`, `platform_admin` |

Controllers live in [`apps/api/src/`](apps/api/src/), one folder per module.

---

## Check-in proof levels

Every check-in records a **proof level** based on the evidence attached to it:

| Level | Evidence | Points |
|---|---|---|
| **L0** | GPS inside the site geofence | 25 |
| **L1** | Valid QR code, without a matching geofence | 75 |
| **L2** | GPS inside geofence **and** valid QR code | 100 |
| + photo | Optional photo, added within 30 minutes (flagged for audit) | +15 |

Each tourist gets at most one confirmed check-in per site per day. Rotating kiosk QR codes are single-use and short-lived, which makes screenshot sharing less useful.

---

## Roadmap

| Phase | Focus |
|---|---|
| Phase 0 | Validation with local partners |
| **MVP 1** *(this repo)* | One destination: check-in, points, badges, vouchers, merchant redemption |
| MVP 2 | Tourism network: cross-destination passport, challenges, campaigns, credential issuance |
| Phase 3 | Trust layer: verifiable credentials, blockchain adapter, partner API |
| Phase 4 | Ecosystem: recommendations, analytics, third-party integrations |

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request, and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Do not report vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE).

Site images in the demo catalog are loaded from [Unsplash](https://unsplash.com/) under the Unsplash License.
