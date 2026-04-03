# The Strongest Kumanovo

Martial arts gym management web app for **The Strongest Kumanovo** in Kumanovo, North Macedonia. Manages members, attendance tracking, and cash payment logging across BJJ, Kickboxing, and MMA. Bilingual (English / Macedonian).

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: Turso (hosted SQLite) + Drizzle ORM
- **Auth**: NextAuth v5 (JWT strategy)
- **Styling**: Tailwind CSS 4 + Framer Motion
- **i18n**: next-intl (EN/MK)
- **Validation**: Zod
- **Testing**: Vitest (440+ tests)
- **Hosting**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (copy and edit)
cp .env.example .env.local
# TURSO_DATABASE_URL=file:local.db
# TURSO_AUTH_TOKEN=
# AUTH_SECRET=your-secret-here-min-32-chars
# AUTH_URL=http://localhost:3000

# Push schema to local database
npm run db:push

# Seed default data (sports, tiers, admin user, schedule)
npm run db:seed

# Start dev server
npm run dev
```

**Default admin login**: `admin` / `admin123`

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed default data |
| `npm run db:studio` | Open Drizzle Studio |

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Quick reference: structure, patterns, commands |
| [docs/PRD.md](docs/PRD.md) | Product requirements document |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture deep-dive |
| [docs/DEVELOPMENT-STATUS.md](docs/DEVELOPMENT-STATUS.md) | Current development status |

## Features

- **Admin Dashboard**: Stats, flagged members, recent activity, attendance by sport
- **Member Management**: CRUD, sport enrollment, belt rank tracking, credential creation
- **Attendance Tracking**: Per-class checklist, calendar heatmap, past date editing
- **Payment Management**: Cash logging, multi-month advance payments, cumulative balance with credit carry-forward, month navigation
- **Schedule Management**: Weekly class slots CRUD, public schedule display
- **Member Portal**: Read-only dashboard with personal stats, attendance, payments
- **Landing Page**: Public-facing with sports showcase, schedule, contact info
