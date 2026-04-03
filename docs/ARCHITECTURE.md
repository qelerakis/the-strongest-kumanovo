# Architecture Document -- The Strongest Kumanovo

A martial arts gym management web application serving **The Strongest Kumanovo** gym in Kumanovo, North Macedonia. The system handles member registration, class scheduling, attendance tracking, payment management, and provides both an admin dashboard and a member self-service portal. It supports bilingual use (English and Macedonian).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack Rationale](#2-tech-stack-rationale)
3. [Directory Structure](#3-directory-structure)
4. [Data Layer Architecture](#4-data-layer-architecture)
5. [Authentication Architecture](#5-authentication-architecture)
6. [Routing and Page Architecture](#6-routing-and-page-architecture)
7. [Server Actions vs Queries Pattern](#7-server-actions-vs-queries-pattern)
8. [Component Architecture](#8-component-architecture)
9. [Internationalization Architecture](#9-internationalization-architecture)
10. [Animation Architecture](#10-animation-architecture)
11. [Styling Architecture](#11-styling-architecture)
12. [Validation Architecture](#12-validation-architecture)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Key Design Decisions](#14-key-design-decisions)

---

## 1. System Overview

The Strongest Kumanovo is a server-rendered Next.js application that manages day-to-day operations for a martial arts gym offering BJJ, Kickboxing, and MMA. An admin manages members, records payments, takes attendance, and configures the weekly class schedule. Members can log in to view their own profile, attendance history, and payment balance.

### System Diagram

```
 +---------------------+
 |                     |
 |   Browser Client    |
 |  (React 19 + RSC)   |
 |                     |
 +----------+----------+
            |
            | HTTPS
            |
 +----------v----------+
 |                     |
 |   Next.js 16 App    |
 |   (Vercel Edge)     |
 |                     |
 |  +---------------+  |
 |  | Middleware     |  |  Route protection (auth check)
 |  +-------+-------+  |
 |          |          |
 |  +-------v-------+  |
 |  | App Router    |  |  Layouts, pages, templates
 |  | (RSC + RCC)   |  |
 |  +-------+-------+  |
 |          |          |
 |  +-------v-------+  |
 |  | Server Actions|  |  Mutations (create/update/delete)
 |  | + Queries     |  |  Reads (data fetching)
 |  +-------+-------+  |
 |          |          |
 +----------+----------+
            |
            | libSQL protocol (HTTP)
            |
 +----------v----------+
 |                     |
 |   Turso Database    |
 |  (Hosted LibSQL /   |
 |   SQLite)           |
 |                     |
 +---------------------+
```

### Request Flow

1. The browser sends a request to the Next.js application hosted on Vercel.
2. Middleware intercepts the request, checks JWT authentication, and enforces role-based access.
3. The App Router resolves the matching layout and page. Server Components fetch data via query functions.
4. Mutations flow through Server Actions, which validate input with Zod, write to the database via Drizzle ORM, and call `revalidatePath` to refresh affected pages.
5. The Drizzle ORM communicates with Turso (hosted LibSQL) over HTTP using `@libsql/client`.

---

## 2. Tech Stack Rationale

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **Next.js** | 16.1.6 | Full-stack React framework | App Router with React Server Components eliminates the need for a separate API layer. Server Actions provide type-safe mutations without REST endpoints. |
| **React** | 19.2.3 | UI library | Server Components reduce client bundle size. `useTransition` and `useActionState` provide smooth form UX. |
| **TypeScript** | 5.x | Type safety | End-to-end type safety from database schema through to component props, catching errors at compile time. |
| **Turso** | (hosted) | Production database | SQLite-compatible edge database with HTTP-based access. Zero cold-start latency, generous free tier, ideal for single-gym scale. |
| **Drizzle ORM** | 0.45.1 | Database toolkit | Typed schema definitions that serve as the single source of truth. Lightweight, no runtime overhead, SQL-like query builder. |
| **@libsql/client** | 0.17.0 | Database driver | Official Turso client. Supports both remote (Turso) and local (`file:local.db`) connections for development. |
| **NextAuth v5** | 5.0.0-beta.30 | Authentication | First-party Next.js auth solution. JWT strategy avoids database session overhead. Middleware integration for route protection. |
| **bcryptjs** | 3.0.3 | Password hashing | Pure JavaScript bcrypt implementation (no native bindings required). 12 salt rounds for security. |
| **Tailwind CSS** | 4.x | Styling | Utility-first CSS with custom theme tokens. Tailwind v4 uses `@theme` blocks for design tokens in plain CSS. |
| **Framer Motion** | 12.34.3 | Animations | Declarative animation library for page transitions and scroll-triggered reveals. |
| **next-intl** | 4.8.3 | Internationalization | Server-side locale resolution, message loading, and translation hooks for both Server and Client Components. |
| **Zod** | 4.3.6 | Validation | Runtime schema validation with TypeScript type inference. Shared schemas between client forms and server actions. |
| **@paralleldrive/cuid2** | 3.3.0 | ID generation | Collision-resistant, URL-safe, non-sequential IDs. Used as primary keys across all tables. |

---

## 3. Directory Structure

```
the-strongest-kumanovo/
|
+-- src/
|   +-- app/                          # Next.js App Router (pages + layouts)
|   |   +-- layout.tsx                # Root layout: html/body, fonts, NextIntlClientProvider
|   |   +-- template.tsx              # Root template: Framer Motion page-transition wrapper
|   |   +-- page.tsx                  # Public landing page (hero, sports, schedule, contact)
|   |   +-- globals.css               # Tailwind v4 @theme tokens + global styles
|   |   +-- error.tsx                 # Global error boundary
|   |   +-- not-found.tsx             # 404 page
|   |   +-- favicon.ico               # App favicon
|   |   +-- login/
|   |   |   +-- page.tsx              # Login form page
|   |   +-- dashboard/                # Admin area (role: admin)
|   |   |   +-- layout.tsx            # Auth guard + DashboardShell wrapper
|   |   |   +-- loading.tsx           # Dashboard loading skeleton
|   |   |   +-- page.tsx              # Dashboard home (stats, flagged members, recent activity)
|   |   |   +-- members/
|   |   |   |   +-- page.tsx          # Member list with filters
|   |   |   |   +-- new/
|   |   |   |   |   +-- page.tsx      # Create new member form
|   |   |   |   +-- [id]/
|   |   |   |       +-- page.tsx      # Member detail view
|   |   |   |       +-- member-detail-header.tsx  # Client component for member detail actions
|   |   |   +-- attendance/
|   |   |   |   +-- page.tsx          # Attendance management (date picker + class sessions)
|   |   |   +-- payments/
|   |   |   |   +-- page.tsx          # Payment overview + log new payments
|   |   |   +-- schedule/
|   |   |   |   +-- page.tsx          # Weekly schedule editor
|   |   |   +-- settings/
|   |   |       +-- page.tsx          # Tier pricing management
|   |   +-- member/                   # Member self-service area (role: member)
|   |   |   +-- layout.tsx            # Auth guard + MemberShell wrapper
|   |   |   +-- page.tsx              # Member dashboard (own profile, attendance, balance)
|   |   +-- api/
|   |       +-- auth/
|   |           +-- [...nextauth]/
|   |               +-- route.ts      # NextAuth API route handler (GET + POST)
|   |
|   +-- components/                   # React components organized by domain
|   |   +-- ui/                       # Generic UI primitives
|   |   |   +-- button.tsx            # Button with variants (primary, secondary, danger, ghost)
|   |   |   +-- card.tsx              # Card container with header/content/footer
|   |   |   +-- input.tsx             # Labeled text input with error state
|   |   |   +-- select.tsx            # Labeled select dropdown
|   |   |   +-- badge.tsx             # Status/tag badge
|   |   |   +-- checkbox.tsx          # Styled checkbox
|   |   |   +-- dialog.tsx            # Modal dialog overlay
|   |   |   +-- table.tsx             # Responsive data table
|   |   |   +-- skeleton.tsx          # Loading skeleton placeholders
|   |   |   +-- toast.tsx             # Toast notification system
|   |   +-- layout/                   # App shell and navigation
|   |   |   +-- dashboard-shell.tsx   # Admin layout: sidebar + header + mobile nav
|   |   |   +-- member-shell.tsx      # Member layout: header + logout
|   |   |   +-- sidebar.tsx           # Desktop sidebar navigation
|   |   |   +-- header.tsx            # Top header bar with user info
|   |   |   +-- mobile-nav.tsx        # Mobile slide-out navigation
|   |   |   +-- locale-switcher.tsx   # EN/MK language toggle
|   |   +-- landing/                  # Public landing page sections
|   |   |   +-- hero.tsx              # Hero banner with CTA
|   |   |   +-- sports-showcase.tsx   # Sports grid (BJJ, Kickboxing, MMA)
|   |   |   +-- schedule-display.tsx  # Public weekly schedule view
|   |   |   +-- contact-section.tsx   # Contact information and map
|   |   +-- members/                  # Member management components
|   |   |   +-- member-list.tsx       # Filterable member table/grid
|   |   |   +-- member-card.tsx       # Individual member summary card
|   |   |   +-- member-form.tsx       # Create/edit member form
|   |   |   +-- belt-rank-badge.tsx   # Colored belt rank indicator
|   |   +-- attendance/               # Attendance tracking components
|   |   |   +-- attendance-page-client.tsx  # Client-side attendance workflow orchestrator
|   |   |   +-- class-picker.tsx      # Date + class session selector
|   |   |   +-- attendance-checklist.tsx    # Member checklist for marking presence
|   |   |   +-- attendance-calendar.tsx     # Calendar view of attendance history
|   |   +-- payments/                 # Payment components
|   |   |   +-- payment-form.tsx      # Log new payment form
|   |   |   +-- payments-overview.tsx # Monthly payment summary table
|   |   |   +-- payment-history.tsx   # Individual member payment history
|   |   |   +-- balance-display.tsx   # Computed balance indicator (credit/debt)
|   |   |   +-- tier-pricing-form.tsx # Edit membership tier prices
|   |   +-- schedule/                 # Schedule management components
|   |   |   +-- weekly-grid.tsx       # 7-day schedule grid display
|   |   |   +-- schedule-editor.tsx   # Add/edit/remove class slots
|   |   +-- dashboard/                # Dashboard-specific widgets
|   |   |   +-- stats-cards.tsx       # KPI cards (members, attendance rate, revenue)
|   |   |   +-- flagged-members.tsx   # Low-attendance member alerts
|   |   |   +-- recent-activity.tsx   # Recent payment feed
|   |   +-- motion/                   # Reusable animation wrappers
|   |       +-- fade-in.tsx           # Scroll-triggered fade-in animation
|   |       +-- stagger-children.tsx  # Staggered children animation container
|   |       +-- page-transition.tsx   # Page-level enter animation
|   |
|   +-- db/                           # Database layer
|   |   +-- schema.ts                 # Drizzle table definitions (9 tables)
|   |   +-- index.ts                  # Database client connection (singleton)
|   |   +-- seed.ts                   # Seed script: sports, tiers, admin user, schedule
|   |
|   +-- lib/                          # Business logic
|   |   +-- actions/                  # Server Actions (mutations)
|   |   |   +-- auth.ts              # login, logout, createMemberCredentials
|   |   |   +-- members.ts           # createMember, updateMember, toggleMemberStatus, deleteMember
|   |   |   +-- attendance.ts        # openClassSession, markAttendance, getSessionsForDateAction
|   |   |   +-- payments.ts          # logPayment, deletePayment
|   |   |   +-- schedule.ts          # addClassSlot, updateClassSlot, removeClassSlot
|   |   |   +-- settings.ts          # updateTierPricing
|   |   |   +-- locale.ts            # setLocale (cookie-based)
|   |   +-- queries/                  # Read-only data fetching functions
|   |   |   +-- members.ts           # getAllMembers, getMemberById, getMemberBalance
|   |   |   +-- attendance.ts        # getClassSessionsForDate, getAttendanceForSession, getMemberAttendanceHistory
|   |   |   +-- payments.ts          # getPaymentsForMember, getPaymentsSummary
|   |   |   +-- schedule.ts          # getFullSchedule, getScheduleForDay, getScheduleById
|   |   |   +-- settings.ts          # getMembershipTiers, getAllSports
|   |   |   +-- dashboard.ts         # getDashboardStats, getFlaggedMembers, getRecentPayments
|   |   +-- validators.ts            # Zod schemas (member, payment, schedule, credentials, tierPricing)
|   |   +-- utils.ts                 # Utility functions (formatMKD, formatDate, formatTime, cn, etc.)
|   |
|   +-- i18n/
|   |   +-- request.ts               # next-intl server config: cookie-based locale resolution
|   |
|   +-- types/
|   |   +-- index.ts                  # Shared TypeScript types (UserRole, BeltRank, DayOfWeek, constants)
|   |
|   +-- auth.ts                       # NextAuth v5 configuration (providers, callbacks, JWT strategy)
|
+-- messages/                         # Internationalization message files
|   +-- en.json                       # English translations
|   +-- mk.json                       # Macedonian translations
|
+-- middleware.ts                      # Route protection middleware (admin/member/public)
+-- next.config.ts                    # Next.js config with next-intl plugin
+-- package.json                      # Dependencies and scripts
+-- tsconfig.json                     # TypeScript configuration
+-- drizzle.config.ts                 # Drizzle Kit configuration
```

---

## 4. Data Layer Architecture

### Database: Turso (Hosted LibSQL/SQLite)

The application uses **Turso**, a hosted LibSQL service that provides a SQLite-compatible database accessible over HTTP. This gives SQLite semantics (single-writer, ACID transactions, zero-config) with a hosted deployment model suitable for production on serverless platforms like Vercel.

### ORM: Drizzle

Drizzle ORM provides a typed schema definition layer and a SQL-like query builder. The schema file (`src/db/schema.ts`) serves as the single source of truth for the database structure. Drizzle generates TypeScript types from the schema, ensuring compile-time safety for all database operations.

### Connection

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

The `db` instance is a module-level singleton. In development, `TURSO_DATABASE_URL` points to `file:local.db` (a local SQLite file). In production, it points to the Turso cloud URL with an auth token.

### Schema Design: 9 Tables

```
+------------------+       +-------------------+       +------------------+
|     users        |       |     members       |       | membership_tiers |
+------------------+       +-------------------+       +------------------+
| id (PK, CUID2)  |       | id (PK, CUID2)   |<------| id (PK, CUID2)  |
| username (unique)|  FK   | full_name         |       | name             |
| password_hash    |------>| phone             |  FK   | name_key         |
| role (enum)      |       | email             |------>| sports_allowed   |
| member_id (FK?)  |       | date_of_birth     |       | monthly_price_mkd|
| created_at       |       |                   |       | is_active        |
+------------------+       | membership_tier_id|       | updated_at       |
                           | belt_rank (enum)  |       +------------------+
                           | join_date         |
                           | is_active         |
                           | notes             |
                           | created_at        |
                           | updated_at        |
                           +-------------------+
                                  |
                    +-------------+-------------+
                    |                           |
          +---------v--------+        +---------v---------+
          |  member_sports   |        |     payments      |
          | (Junction Table) |        +-------------------+
          +------------------+        | id (PK, CUID2)   |
          | id (PK, CUID2)  |        | member_id (FK)    |
          | member_id (FK)  |        | amount_mkd        |
          | sport_id (FK)   |        | payment_date      |
          | UNIQUE(member,  |        | month_for (YYYY-MM)|
          |        sport)   |        | notes              |
          +--------+---------+        | created_at        |
                   |                  +-------------------+
          +--------v---------+
          |     sports       |
          +------------------+                +-------------------+
          | id (PK, CUID2)  |                |    attendance     |
          | name             |                +-------------------+
          | name_key         |                | id (PK, CUID2)   |
          | color            |                | member_id (FK)    |
          | created_at       |                | class_session_id  |
          +--------+---------+                | present (boolean) |
                   |                          | created_at        |
          +--------v---------+                | UNIQUE(member,    |
          |    schedule      |                |        session)   |
          +------------------+                +-------------------+
          | id (PK, CUID2)  |                         ^
          | sport_id (FK)   |                         |
          | day_of_week     |                +--------+----------+
          | start_time      |                |  class_sessions   |
          | end_time        |                +-------------------+
          | is_active       |                | id (PK, CUID2)   |
          | created_at      |<---------------| schedule_id (FK) |
          +------------------+                | date             |
                                             | notes            |
                                             | created_at       |
                                             | UNIQUE(schedule, |
                                             |        date)     |
                                             +-------------------+
```

### Table Descriptions

| Table | Purpose | Key Relationships |
|---|---|---|
| `users` | Authentication accounts (admin + member logins) | Optional FK to `members` via `member_id` |
| `members` | Gym member profiles (name, contact, belt rank) | FK to `membership_tiers`; referenced by payments, attendance, member_sports |
| `membership_tiers` | Pricing plans (Basic/Standard/Premium) | Referenced by `members` |
| `sports` | Available martial arts disciplines | Referenced by `schedule`, `member_sports` |
| `member_sports` | Junction table: which sports each member practices | Unique constraint on (member_id, sport_id) |
| `schedule` | Recurring weekly class slots (day + time + sport) | FK to `sports`; referenced by `class_sessions` |
| `class_sessions` | Actual instances of classes on specific dates | FK to `schedule`; unique constraint on (schedule_id, date) |
| `attendance` | Per-member presence records for each class session | FKs to `members` and `class_sessions`; unique constraint on (member_id, class_session_id) |
| `payments` | Cash payment records with amount and target month | FK to `members` |

### Computed Fields (Not Stored)

The member **balance** is never stored in the database. It is computed on every read by `getMemberBalance()`:

```
totalOwed  = count(months from joinDate to currentMonth) * tier.monthlyPriceMkd
totalPaid  = SUM(payments.amountMkd) for this member
balance    = totalPaid - totalOwed
```

A positive balance means credit; negative means debt. This approach guarantees accuracy -- retroactive tier price changes, backdated join dates, or deleted payments are always reflected correctly without any need for recalculation triggers or background jobs.

### Seed Data Strategy

The seed script (`src/db/seed.ts`) populates foundational data required for the application to function:

1. **Sports**: BJJ, Kickboxing, MMA -- each with a brand color and an i18n `nameKey`.
2. **Membership Tiers**: Basic (1 sport, 1500 MKD), Standard (2 sports, 2500 MKD), Premium (unlimited, 3500 MKD).
3. **Admin User**: A default admin account (`admin`/`admin123`) with role `"admin"` and no associated member profile.
4. **Default Schedule**: A realistic weekly class schedule with 8 slots across Monday, Tuesday, Wednesday, Thursday, and Saturday.

All inserts use `onConflictDoNothing()` to make the seed script idempotent. The seed is run manually via `npx tsx src/db/seed.ts`.

---

## 5. Authentication Architecture

### Provider: NextAuth v5 with Credentials

Authentication is handled by **NextAuth v5** (Auth.js) using the Credentials provider. Users authenticate with a username and password. The system does not use OAuth or social login providers -- this is a single-gym internal tool.

### Configuration (`src/auth.ts`)

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Validate input exists
        // 2. Look up user by username in database
        // 3. Compare password with bcryptjs.compareSync
        // 4. Return user object {id, name, role, memberId} or null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Enrich JWT with role, memberId, username on first sign-in
    },
    async session({ session, token }) {
      // Map JWT claims to session.user
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});
```

### Session Strategy: JWT (No Database Sessions)

The application uses the JWT session strategy exclusively. No session records are stored in the database. The JWT contains:

| Claim | Source | Purpose |
|---|---|---|
| `sub` | `user.id` | User's CUID2 primary key |
| `role` | `user.role` | `"admin"` or `"member"` -- used for route protection |
| `memberId` | `user.memberId` | Links to the member profile (null for admin) |
| `username` | `user.name` | Display name in the UI |

### Token Flow

1. User submits credentials via the login form (Server Action `loginAction`).
2. NextAuth's `authorize` function queries the database and verifies the bcrypt hash.
3. On success, the `jwt` callback enriches the token with `role`, `memberId`, and `username`.
4. The `session` callback maps these claims to the `session.user` object.
5. Subsequent requests carry the JWT in an HTTP-only cookie.

### Password Hashing

Passwords are hashed using **bcryptjs** with **12 salt rounds**:
- `hashSync(password, 12)` for creating accounts (in seed and `createMemberCredentials`).
- `compareSync(password, hash)` for login verification.

### API Route

The NextAuth API route is at `src/app/api/auth/[...nextauth]/route.ts` and simply re-exports the `handlers` from the auth configuration:

```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

### Middleware-Based Route Protection

The `middleware.ts` file wraps NextAuth's `auth()` middleware to enforce role-based access:

```
Request
  |
  v
middleware.ts (auth wrapper)
  |
  +-- /dashboard/* --> requires isLoggedIn AND role === "admin"
  |                    else redirect to /login
  |
  +-- /member/*    --> requires isLoggedIn AND role === "member"
  |                    else redirect to /login
  |
  +-- /login       --> if already logged in, redirect to
  |                    /dashboard (admin) or /member (member)
  |
  +-- everything else --> pass through (public)
```

The middleware matcher excludes static assets and API routes:
```typescript
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Role Hierarchy

```
admin          Full access to /dashboard/* routes. Can manage members,
               payments, attendance, schedule, and settings.

member         Access to /member/* routes only. Can view own profile,
               attendance history, and payment balance.

unauthenticated  Access to public routes only: / (landing page)
                 and /login.
```

### Layout-Level Auth Guards

In addition to middleware, each protected layout performs a server-side auth check:

- `src/app/dashboard/layout.tsx`: Calls `auth()`, checks `role === "admin"`, redirects to `/login` if unauthorized.
- `src/app/member/layout.tsx`: Calls `auth()`, checks `role === "member"`, redirects to `/login` if unauthorized.

This provides defense-in-depth: even if middleware is bypassed (e.g., during development), the layout guards prevent unauthorized rendering.

---

## 6. Routing and Page Architecture

### App Router with Layout Nesting

The application uses Next.js 16 App Router with nested layouts:

```
Root Layout (src/app/layout.tsx)
|-- Provides: <html>, <body>, fonts, NextIntlClientProvider
|-- Root Template (src/app/template.tsx)
|   |-- Provides: Framer Motion page transition wrapper
|   |
|   +-- / (landing page)
|   +-- /login (login form)
|   +-- /dashboard/* (admin area)
|   |   +-- Dashboard Layout (dashboard/layout.tsx)
|   |       |-- Provides: Auth guard, DashboardShell (sidebar + header)
|   |       +-- /dashboard (stats overview)
|   |       +-- /dashboard/members (member list)
|   |       +-- /dashboard/members/new (create member)
|   |       +-- /dashboard/members/[id] (member detail)
|   |       +-- /dashboard/attendance (attendance management)
|   |       +-- /dashboard/payments (payment overview)
|   |       +-- /dashboard/schedule (schedule editor)
|   |       +-- /dashboard/settings (tier pricing)
|   +-- /member/* (member area)
|       +-- Member Layout (member/layout.tsx)
|           |-- Provides: Auth guard, MemberShell (header + logout)
|           +-- /member (member self-service dashboard)
```

### Route Groups

| Group | Routes | Access | Layout Shell |
|---|---|---|---|
| **Public** | `/`, `/login` | Everyone | None (bare layout) |
| **Admin** | `/dashboard`, `/dashboard/members`, `/dashboard/members/new`, `/dashboard/members/[id]`, `/dashboard/attendance`, `/dashboard/payments`, `/dashboard/schedule`, `/dashboard/settings` | `role: admin` | `DashboardShell` (sidebar + header + mobile nav) |
| **Member** | `/member` | `role: member` | `MemberShell` (header + logout) |

### Page Data Flow Pattern

Every page follows the same pattern:

```
Page (Server Component)
  |
  +--> Calls query functions from src/lib/queries/*
  |    (direct database reads, no API layer)
  |
  +--> Passes data as props to Client Components
  |
  +--> Client Components call Server Actions from src/lib/actions/*
       for mutations (forms, buttons)
```

Example flow for the Members page:

```
dashboard/members/page.tsx (Server Component)
  |
  +--> getAllMembers(filters)          -- query
  +--> getMembershipTiers()            -- query
  +--> getAllSports()                  -- query
  |
  +--> <MemberList members={...} />   -- Client Component
         |
         +--> toggleMemberStatus(id)  -- Server Action (on button click)
         +--> deleteMember(id)        -- Server Action (on button click)
```

---

## 7. Server Actions vs Queries Pattern

The application enforces a strict separation between reads and writes at the directory level.

### Queries: `src/lib/queries/*`

- **Purpose**: Read-only data fetching.
- **Usage**: Called directly in Server Components (pages and layouts).
- **Characteristics**:
  - Pure functions that accept filter parameters and return typed data.
  - Perform JOINs, aggregations, and grouping using Drizzle's query builder.
  - Never modify database state.
  - Not marked with `"use server"` -- they are regular async functions called on the server.

| File | Functions |
|---|---|
| `queries/members.ts` | `getAllMembers(filters)`, `getMemberById(id)`, `getMemberBalance(id)` |
| `queries/attendance.ts` | `getClassSessionsForDate(date)`, `getAttendanceForSession(sessionId)`, `getMemberAttendanceHistory(memberId)`, `getMonthlyAttendanceCount(memberId, month)` |
| `queries/payments.ts` | `getPaymentsForMember(memberId)`, `getPaymentsSummary(month)` |
| `queries/schedule.ts` | `getFullSchedule()`, `getScheduleForDay(dayOfWeek)`, `getScheduleById(id)` |
| `queries/settings.ts` | `getMembershipTiers()`, `getAllSports()` |
| `queries/dashboard.ts` | `getDashboardStats()`, `getFlaggedMembers(month)`, `getRecentPayments(limit)` |

### Actions: `src/lib/actions/*`

- **Purpose**: Mutations (create, update, delete).
- **Usage**: Called from Client Components via form submissions or button clicks.
- **Characteristics**:
  - Marked with `"use server"` directive.
  - Accept `FormData` or typed parameters.
  - Validate input using Zod schemas before writing.
  - Return `{ success: boolean, error?: string }` result objects.
  - Call `revalidatePath()` to invalidate affected pages after mutation.

| File | Functions |
|---|---|
| `actions/auth.ts` | `loginAction(formData)`, `logoutAction()`, `createMemberCredentials(memberId, username, password)` |
| `actions/members.ts` | `createMember(formData)`, `updateMember(id, formData)`, `toggleMemberStatus(id)`, `deleteMember(id)` |
| `actions/attendance.ts` | `openClassSession(scheduleId, date)`, `markAttendance(sessionId, presentIds, allIds)`, `getSessionsForDateAction(date)`, `getSessionDetailsAction(sessionId, sportId)` |
| `actions/payments.ts` | `logPayment(formData)`, `deletePayment(id)` |
| `actions/schedule.ts` | `addClassSlot(formData)`, `updateClassSlot(id, formData)`, `removeClassSlot(id)` |
| `actions/settings.ts` | `updateTierPricing(tierId, newPrice)` |
| `actions/locale.ts` | `setLocale(locale)` |

### Why This Separation

- **Clarity**: Opening `queries/` always means "reading data"; opening `actions/` always means "changing data."
- **Security**: Only action files carry the `"use server"` directive. Query functions cannot be called from the client, preventing accidental exposure of raw database access.
- **Cacheability**: Reads can be cached or memoized independently of writes. Writes explicitly invalidate caches via `revalidatePath`.

---

## 8. Component Architecture

### Organization: Domain-Based Directories

Components are organized by the domain they serve, not by their technical role:

```
components/
  ui/          # Generic, reusable UI primitives (no business logic)
  layout/      # App shell components (navigation, headers, wrappers)
  landing/     # Public landing page sections
  members/     # Member CRUD and display components
  attendance/  # Attendance tracking UI
  payments/    # Payment management UI
  schedule/    # Schedule editing and display
  dashboard/   # Dashboard-specific widgets
  motion/      # Reusable animation wrappers
```

### UI Primitives (`components/ui/`)

These are the building blocks used across all domains. They accept style props, handle accessibility, and define the visual language of the application:

| Component | Description |
|---|---|
| `Button` | Multi-variant button (primary/secondary/danger/ghost) with loading state |
| `Card` | Container with `CardHeader`, `CardContent`, `CardFooter` sub-components |
| `Input` | Labeled text input with error message display |
| `Select` | Labeled dropdown select |
| `Badge` | Colored tag/status indicator |
| `Checkbox` | Styled checkbox with label |
| `Dialog` | Modal overlay with backdrop |
| `Table` | Responsive data table with header and body |
| `Skeleton` | Loading placeholder shapes |
| `Toast` | Notification system for action feedback |

### Layout Shells (`components/layout/`)

Two distinct layout shells provide the app chrome for admin and member areas:

**DashboardShell** (admin):
- `Sidebar` -- desktop-only, fixed left panel with navigation links.
- `Header` -- top bar with page title, user info, role badge, mobile menu toggle.
- `MobileNav` -- slide-out overlay nav for mobile viewports.
- Content area shifts right (`lg:pl-[250px]`) to accommodate the sidebar.

**MemberShell** (member):
- Simpler header-only layout with gym branding, locale switcher, username, and logout button.
- Content is centered with `max-w-5xl mx-auto`.

### Client vs Server Component Strategy

- **Server Components** (default): Pages and layouts. They fetch data from queries, read session state, and resolve translations server-side.
- **Client Components** (`"use client"`): Interactive UI that requires state, event handlers, or browser APIs. These include forms, navigation, animation wrappers, and components using `useTransition`, `useRouter`, or `useState`.

The boundary is drawn to keep the client bundle minimal:
- Pages are Server Components that fetch data and pass it as props.
- Forms and interactive widgets are Client Components that receive data as props and call Server Actions for mutations.

---

## 9. Internationalization Architecture

### Framework: next-intl

The application supports two locales: **English (en)** and **Macedonian (mk)**.

### Locale Resolution

Locale is determined by a cookie, not by URL path segments. This avoids route duplication:

```typescript
// src/i18n/request.ts
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

Default locale is `"en"` if no cookie is set.

### Message Files

Translation messages are stored as flat JSON files:
- `messages/en.json` -- English translations.
- `messages/mk.json` -- Macedonian translations.

Messages are organized by namespace (e.g., `landing.*`, `dashboard.*`, `nav.*`, `members.*`).

### Integration

- **Next.js config**: The `next-intl/plugin` wraps the Next.js config, pointing to the request configuration file.
- **Root layout**: `NextIntlClientProvider` wraps the entire app, making translations available to both Server and Client Components.
- **Server Components**: Use `getTranslations("namespace")` from `next-intl/server`.
- **Client Components**: Use `useTranslations("namespace")` hook.

### Locale Switching

The `LocaleSwitcher` component (in `components/layout/`) calls the `setLocale` Server Action, which sets a cookie with a 1-year expiry:

```typescript
// src/lib/actions/locale.ts
export async function setLocale(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
```

### Translatable Data

Some database records include a `nameKey` field (e.g., `sports.nameKey`, `membershipTiers.nameKey`) that maps to translation keys. This allows sport names like "BJJ" and tier names like "Basic" to be displayed in the user's language.

---

## 10. Animation Architecture

### Framework: Framer Motion

Framer Motion provides declarative, physics-based animations. The application uses it for two purposes: page transitions and scroll-triggered reveals.

### Page Transitions via `template.tsx`

The root `template.tsx` wraps every page change in a fade-and-slide animation:

```typescript
// src/app/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

Unlike `layout.tsx` (which persists across navigations), `template.tsx` re-mounts on every route change, triggering the animation each time.

### Reusable Motion Components

| Component | Animation | Use Case |
|---|---|---|
| `FadeIn` | Fade up (opacity 0 + y:20 to visible) on scroll into viewport | Landing page sections, card reveals |
| `StaggerChildren` | Container that staggers the entrance of child elements | Lists, grids, stat card groups |
| `PageTransition` | Fade up (opacity 0 + y:12 to visible) on mount | Page-level content wrappers within dashboard |

All motion components are Client Components (`"use client"`) since Framer Motion requires browser APIs.

**StaggerChildren** exports `staggerItemVariants` so child elements can participate in the stagger sequence:

```typescript
export { itemVariants as staggerItemVariants };
// Usage: <motion.div variants={staggerItemVariants}> ... </motion.div>
```

---

## 11. Styling Architecture

### Framework: Tailwind CSS 4

The application uses **Tailwind CSS v4** with its new CSS-based configuration approach. Design tokens are defined using `@theme inline` blocks in `globals.css` rather than a JavaScript config file.

### Theme Definition

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Brand colors */
  --color-brand-red: #DC2626;
  --color-brand-red-light: #EF4444;
  --color-brand-red-dark: #B91C1C;
  --color-brand-black: #0A0A0A;
  --color-brand-gold: #EAB308;
  --color-brand-gold-light: #FACC15;
  --color-brand-gold-dark: #CA8A04;
  --color-brand-white: #FAFAFA;

  /* Surface layers (dark theme) */
  --color-surface: #0A0A0A;
  --color-surface-card: #111111;
  --color-surface-hover: #1A1A1A;
  --color-surface-border: #262626;
  --color-surface-elevated: #1F1F1F;

  /* Text hierarchy */
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A3A3A3;
  --color-text-muted: #525252;

  /* Status colors */
  --color-success: #22C55E;
  --color-error: #EF4444;
  --color-warning: #EAB308;

  /* Typography */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Dark Theme Palette

The application is dark-mode only (the `<html>` element always has `className="dark"`). The color system is designed around a dark surface hierarchy:

- **Brand**: Red (#DC2626) as the primary accent, Gold (#EAB308) as the secondary accent, White (#FAFAFA) for text.
- **Surfaces**: A gradient from pure black (#0A0A0A) for backgrounds, through card (#111111), hover (#1A1A1A), to elevated (#1F1F1F).
- **Text**: Three levels of hierarchy -- primary (white), secondary (gray), muted (dark gray).
- **Status**: Green for success, red for errors, gold for warnings.

### Typography

The application uses the **Geist** font family (loaded via `next/font/google`):
- `Geist` (sans-serif) for body text and headings.
- `Geist Mono` (monospace) for code and data displays.

Both are loaded with CSS variable injection (`--font-geist-sans`, `--font-geist-mono`) and referenced in the Tailwind theme.

### `cn()` Utility

A lightweight class name merging utility (defined in `src/lib/utils.ts`):

```typescript
export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}
```

Used throughout components for conditional class application:
```tsx
<div className={cn("base-class", isActive && "active-class", error && "error-class")} />
```

### Responsive Approach

Mobile-first design with Tailwind breakpoints:
- Base styles target mobile viewports.
- `sm:` (640px+), `lg:` (1024px+) prefixes add desktop enhancements.
- The admin sidebar is hidden on mobile and replaced with a slide-out `MobileNav`.

---

## 12. Validation Architecture

### Framework: Zod

All form validation is handled by **Zod** schemas defined in `src/lib/validators.ts`. These schemas serve triple duty:

1. **Runtime validation** in Server Actions (`.safeParse()`).
2. **TypeScript type generation** via `z.infer<typeof schema>`.
3. **Documentation** of what each form expects.

### Schema Definitions

| Schema | Fields | Used By |
|---|---|---|
| `memberSchema` | fullName (required), phone, email, dateOfBirth, emergencyContact, membershipTierId (required), beltRank (enum), joinDate (required), notes | `createMember`, `updateMember` actions |
| `paymentSchema` | memberId (required), amountMkd (positive int), paymentDate (required), monthFor (YYYY-MM regex), notes | `logPayment` action |
| `scheduleSchema` | sportId (required), dayOfWeek (0-6 int), startTime (HH:MM regex), endTime (HH:MM regex, optional) | `addClassSlot`, `updateClassSlot` actions |
| `credentialsSchema` | username (min 3 chars), password (min 6 chars) | `createMemberCredentials` action |
| `tierPricingSchema` | monthlyPriceMkd (positive int) | `updateTierPricing` action |

### Validation Flow

```
Client Component (form)
  |
  +--> Collects FormData
  |
  +--> Calls Server Action
       |
       +--> Extract raw values from FormData
       |
       +--> schema.safeParse(raw)
       |    |
       |    +-- success: false --> return { success: false, error: "..." }
       |    |
       |    +-- success: true  --> proceed with parsed.data (typed)
       |
       +--> Database operation with validated, typed data
       |
       +--> revalidatePath(...)
       |
       +--> return { success: true }
```

### Type Safety Chain

The type safety flows from schema definition through to the UI:

```
Zod Schema (validators.ts)
  |
  +--> z.infer<typeof memberSchema> = MemberFormData (exported type)
  |
  +--> Used as prop type in form components
  |
  +--> Server Action receives FormData, validates against schema
  |
  +--> Drizzle insert/update uses parsed.data (matches DB schema types)
```

---

## 13. Deployment Architecture

### Hosting: Vercel

The application is designed for deployment on **Vercel**:
- Server Components and Server Actions run as serverless functions.
- Static assets are served from the Vercel CDN.
- The middleware runs at the edge for fast auth checks.
- `next.config.ts` includes `allowedDevOrigins` for local development.

### Database: Turso

Production uses a Turso hosted database, accessed over HTTP via the libSQL protocol. There is no traditional database connection pool; each request creates a lightweight HTTP connection.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | Turso database URL (`libsql://...`) or `file:local.db` for local dev |
| `TURSO_AUTH_TOKEN` | Production only | Turso authentication token (not needed for local SQLite) |
| `AUTH_SECRET` | Yes | NextAuth secret for JWT signing (should be a random 32+ char string) |
| `AUTH_URL` | Production only | Canonical URL of the app (e.g., `https://the-strongest-kumanovo.vercel.app`) |

### Local Development

For local development:
- `TURSO_DATABASE_URL=file:local.db` -- uses a local SQLite file.
- `TURSO_AUTH_TOKEN` is omitted (not needed for file-based SQLite).
- Database schema is pushed with `drizzle-kit push`.
- Seed data is loaded with `npx tsx src/db/seed.ts`.

### Build and Development Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Start development server with hot reload |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |
| `db:generate` | `drizzle-kit generate` | Generate SQL migrations from schema |
| `db:push` | `drizzle-kit push` | Push schema directly to database (no migrations) |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio (database GUI) |
| `db:seed` | `npx tsx src/db/seed.ts` | Run the database seed script |

---

## 14. Key Design Decisions

### Computed Balance (Not Stored)

The member balance (how much they owe or have in credit) is **never persisted** in the database. Instead, it is calculated on every read from the `payments` table and the member's tier price and join date. This eliminates an entire class of consistency bugs: there is no stale balance, no need for triggers, and retroactive changes (like correcting a join date or adjusting a tier price) are automatically reflected.

### Auto-Created Class Sessions from Schedule

When attendance is taken for a given date, the system checks if `class_sessions` records already exist for that date. If not, it automatically creates them from the recurring `schedule` table based on the day of the week. This means the admin never has to manually "open" a class -- the schedule defines what classes happen on which days, and sessions materialize on demand.

### Cash-Only Payments (No Payment Gateway)

The payment system records cash payments manually. There is no Stripe, PayPal, or any online payment integration. Payments are logged by the admin with an amount (in Macedonian Denar / MKD), a date, and the month the payment covers. This reflects the real-world operation of the gym, where members pay in cash.

### Single-Gym, Single-Admin Design

The application is purpose-built for a single gym with a single admin user. There is no multi-tenancy, no organization model, and no admin invitation system. The admin account is created by the seed script. This simplicity keeps the codebase small and the mental model straightforward.

### CUID2 for All IDs

Every table uses **CUID2** (Collision-resistant Unique IDentifier) as primary keys instead of auto-incrementing integers. Benefits:
- **No enumeration**: Sequential IDs reveal record counts and can be guessed. CUIDs are opaque.
- **Client-side generation**: IDs can be generated before database insertion, useful for optimistic UI patterns.
- **Merge-safe**: No conflicts when combining data from different databases or environments.

### Cookie-Based Locale (Not URL-Based)

The application stores the user's language preference in a cookie rather than in the URL path (e.g., `/en/dashboard` vs `/mk/dashboard`). This avoids duplicating every route for each locale and keeps URLs clean. The tradeoff is that the locale is not visible in the URL, but for an internal gym management tool this is acceptable.

### No Separate API Layer

The application does not have REST or GraphQL endpoints. Server Components call query functions directly, and Client Components call Server Actions for mutations. This eliminates an entire layer of boilerplate (route handlers, request/response serialization, API client) while maintaining type safety end-to-end.

### JWT-Only Authentication (No Database Sessions)

Sessions are stored entirely in JWTs, with no server-side session table. This reduces database load and simplifies the schema. The tradeoff is that session revocation requires token expiry (rather than immediate invalidation), but for a single-gym app with a small user base, this is an acceptable tradeoff.

### Unique Constraints as Business Rules

Several critical business rules are enforced at the database level through unique constraints:
- A member can only be enrolled in a sport once: `UNIQUE(member_id, sport_id)` on `member_sports`.
- A class session can only exist once per schedule slot per date: `UNIQUE(schedule_id, date)` on `class_sessions`.
- Attendance can only be recorded once per member per session: `UNIQUE(member_id, class_session_id)` on `attendance`.

This makes it impossible to create duplicate records even if application-level validation is bypassed.
