# The Strongest Kumanovo - Gym Management App

## Project Overview
Martial arts gym management web app for a gym in Kumanovo, North Macedonia. Manages members, attendance, cash payments across 3 sports: BJJ, Kickboxing, MMA. Admin dashboard + member read-only view. Bilingual EN/MK.

## Tech Stack
- Next.js 16.1.6 (App Router) + TypeScript 5
- React 19.2.3
- Turso (hosted SQLite via @libsql/client 0.17) + Drizzle ORM 0.45
- NextAuth v5 beta.30 (Credentials provider, JWT strategy)
- Tailwind CSS 4 + Framer Motion 12
- next-intl 4.8 for EN/MK bilingual support
- Zod 4 for validation
- Deployed on Vercel

## Key Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:seed` - Seed database (sports, tiers, admin user, default schedule)
- `npm run test` - Run all tests (Vitest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Project Structure
```
src/
  app/                    # Next.js App Router pages
    layout.tsx            # Root layout: NextIntlClientProvider, Geist fonts, dark theme
    template.tsx          # Framer Motion page transitions (opacity + y fade-in)
    page.tsx              # Landing page (public)
    login/page.tsx        # Shared login for admin + member
    dashboard/            # Admin-only pages (protected by middleware)
      page.tsx            # Admin overview (stats, flagged members, recent activity)
      members/page.tsx    # Member list with filters
      members/new/page.tsx
      members/[id]/page.tsx
      attendance/page.tsx
      payments/page.tsx    # Accepts ?month=YYYY-MM for month navigation
      schedule/page.tsx
      settings/page.tsx
    member/page.tsx       # Member-only dashboard (read-only)
    api/auth/             # NextAuth route handler
  auth.ts                 # NextAuth config (Credentials provider, JWT callbacks)
  components/             # React components organized by domain
    ui/                   # Primitives: Button, Card, Input, Select, Badge, Checkbox, Dialog, Table, Toast, Skeleton
    layout/               # Shells: DashboardShell, MemberShell, Header, Sidebar, MobileNav, LocaleSwitcher
    members/              # MemberForm, MemberList, MemberCard, BeltRankBadge
    attendance/           # ClassPicker, AttendanceChecklist, AttendanceCalendar, AttendancePageClient
    payments/             # PaymentForm, PaymentHistory, BalanceDisplay, PaymentsOverview, TierPricingForm
    schedule/             # ScheduleEditor, WeeklyGrid
    dashboard/            # StatsCards, FlaggedMembers, RecentActivity
    landing/              # Hero, SportsShowcase, ScheduleDisplay, ContactSection
    motion/               # PageTransition, FadeIn, StaggerChildren
  db/
    schema.ts             # 9 Drizzle table definitions
    index.ts              # Drizzle + libSQL client connection
    seed.ts               # Seeds sports, tiers, admin user, default schedule
  lib/
    actions/              # Server Actions (mutations)
      members.ts, attendance.ts, payments.ts, schedule.ts, auth.ts, settings.ts, locale.ts
    queries/              # Read-only data fetching for Server Components
      members.ts, attendance.ts, payments.ts, schedule.ts, dashboard.ts, settings.ts
    utils.ts              # formatMKD(), formatDate(), formatTime(), getCurrentMonth(), cn(), getMonthsBetween(), incrementMonth()
    validators.ts         # Zod schemas: memberSchema, paymentSchema, scheduleSchema, credentialsSchema, tierPricingSchema
  i18n/
    request.ts            # next-intl config, reads locale from cookie, defaults to "en"
  types/
    index.ts              # UserRole, BeltRank, DayOfWeek types + BELT_COLORS, DAY_NAMES constants
middleware.ts             # Route protection: /dashboard (admin only), /member (member only), login redirect
messages/
  en.json                 # English translations
  mk.json                 # Macedonian translations
```

## Architecture Patterns
- **Server Actions** (`src/lib/actions/*`): All mutations. Use `revalidatePath()` after writes.
- **Queries** (`src/lib/queries/*`): Read-only data fetching for Server Components.
- **Validation**: Zod schemas in `src/lib/validators.ts`. Always validate in server actions before DB writes.
- **Auth**: NextAuth v5 JWT strategy. Session has `user.id`, `user.username`, `user.role`, `user.memberId`. Check session in server actions. Middleware protects `/dashboard` (admin) and `/member` (member) routes.
- **i18n**: next-intl. Locale stored in cookie (default "en"). Translations in `messages/en.json` and `messages/mk.json`. Use `useTranslations()` in client components, `getTranslations()` in server components.
- **Components**: Domain-organized. UI primitives in `ui/`, layout shells in `layout/`, feature components in their domain folder.
- **IDs**: CUID2 via `@paralleldrive/cuid2` for all primary keys. Generated by `$defaultFn(() => createId())` in schema.
- **Passwords**: bcryptjs with 12 salt rounds.

## Database
- 9 tables: `users`, `members`, `sports`, `membership_tiers`, `member_sports`, `schedule`, `class_sessions`, `attendance`, `payments`
- Local dev: `file:local.db` (SQLite file)
- Production: Turso hosted database
- Credit balance is COMPUTED at query time (cumulative): `SUM(payments where monthFor <= selectedMonth) - (months from joinDate to selectedMonth * tier_price)`. Never stored as a column. Overpay credits carry forward automatically.
- `dayOfWeek` uses JS convention: 0=Sunday, 1=Monday, ..., 6=Saturday
- Unique constraints: `member_sports(memberId, sportId)`, `class_sessions(scheduleId, date)`, `attendance(memberId, classSessionId)`
- Cascade deletes on: memberSports, schedule, classSessions, attendance, payments (all cascade from parent)

## Business Rules
- Tiers: Basic (1 sport, 1500 MKD), Standard (2 sports, 2500 MKD), Premium (all sports, 3500 MKD)
- Premium tier uses `sportsAllowed: -1` to represent unlimited
- <3 monthly attendances = flagged for potential fee waiver
- Sports: BJJ, Kickboxing, MMA
- Belt ranks: white, blue, purple, brown, black
- Cash payments only (no online processing)
- Currency: Macedonian Denar (MKD)

## Theme
Dark theme applied via `className="dark"` on `<html>`. Fonts: Geist Sans + Geist Mono.
Colors: Red `#DC2626`, Black `#0A0A0A`, Gold `#EAB308`, White `#FAFAFA`.
Surface/cards `bg-surface`, borders `border`. Mobile-first responsive.

## Environment Variables
- `TURSO_DATABASE_URL` - Database URL (`file:local.db` for dev)
- `TURSO_AUTH_TOKEN` - Turso auth token (empty string for local dev)
- `AUTH_SECRET` - NextAuth secret (min 32 chars)
- `AUTH_URL` - App URL (`http://localhost:3000` for dev)

## Default Admin Credentials (dev only)
- Username: `admin`
- Password: `admin123`

## Common Patterns

### Adding a new feature
1. Add/modify schema in `src/db/schema.ts`, run `npm run db:push`
2. Add Zod validator in `src/lib/validators.ts`
3. Create query functions in `src/lib/queries/`
4. Create server actions in `src/lib/actions/` (validate with Zod, check auth, `revalidatePath` after writes)
5. Add translations to both `messages/en.json` and `messages/mk.json`
6. Build component in `src/components/[domain]/`
7. Create page in `src/app/[route]/page.tsx`

### Import aliases
- `@/` maps to `src/` (e.g., `import { db } from "@/db"`, `import { auth } from "@/auth"`)



---

## Architecture Principles (Next.js/Drizzle Adaptation)

This project follows layered architecture adapted for the Next.js App Router + Drizzle stack:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Schema | `src/db/schema.ts` | Drizzle table definitions (single source of truth) |
| Queries | `src/lib/queries/*` | Read-only data fetching for Server Components |
| Actions | `src/lib/actions/*` | Server Actions for mutations (validate + auth + revalidate) |
| Validators | `src/lib/validators.ts` | Zod schemas for all input validation |
| Components | `src/components/*` | Domain-organized React components |
| Pages | `src/app/*` | Next.js routing, Server Components as data loaders |

### Rules
1. **Never skip layers** - Pages call queries/actions, not DB directly
2. **Always validate in server actions** - `safeParse()` before any DB write
3. **Always check auth in server actions** - `const session = await auth()` + role check
4. **Always `revalidatePath()`** after mutations
5. **Schema changes** go through `npm run db:push` (pre-production) or migrations
6. **Translations**: Every user-facing string in both `messages/en.json` and `messages/mk.json`
7. **Credit balance is COMPUTED** at query time, never stored as a column
