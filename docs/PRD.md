# Product Requirements Document (PRD)

## The Strongest Kumanovo -- Martial Arts Gym Management App

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Version        | 0.1.0                                         |
| Last Updated   | 2026-02-25                                    |
| Status         | In Development                                |
| Owner          | Gym Owner / Admin                             |
| Stack          | Next.js 16, TypeScript, Turso, Drizzle ORM    |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas](#3-user-personas)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Business Rules](#6-business-rules)
7. [UI/UX Requirements](#7-uiux-requirements)
8. [Out of Scope](#8-out-of-scope)
9. [Data Model Summary](#9-data-model-summary)
10. [Deployment](#10-deployment)

---

## 1. Product Overview

### Vision

A purpose-built, bilingual web application for **The Strongest Kumanovo** -- a martial arts gym in Kumanovo, North Macedonia -- that replaces manual record-keeping with a lightweight digital system for member management, attendance tracking, and cash payment logging.

### Problem Statement

The gym currently manages all operations manually: member registrations on paper, attendance tracked informally, and cash payments recorded in notebooks. This leads to:

- No reliable way to know which members have paid and which have outstanding balances.
- No visibility into who is actually attending classes regularly.
- Difficulty identifying members who qualify for fee waivers due to low attendance.
- Time wasted on administrative tasks that should be spent coaching.

### Solution

A single-gym web application that gives the owner a centralized dashboard to manage members, log attendance per class, record cash payments, and instantly see who owes money and who is under-attending. Members get read-only access to their own data.

### Target Users

| User          | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| **Admin**     | The gym owner. Full control over members, attendance, payments, schedule.   |
| **Member**    | An athlete enrolled at the gym. Read-only view of their own data.           |
| **Public**    | Anyone visiting the landing page (schedule, sports info, contact details).  |

### Tech Stack

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Framework        | Next.js 16 (App Router)                                 |
| Language         | TypeScript                                              |
| Database         | Turso (hosted SQLite via libSQL)                        |
| ORM              | Drizzle ORM                                             |
| Authentication   | NextAuth v5 (beta), Credentials provider, JWT strategy  |
| Styling          | Tailwind CSS v4                                         |
| Animations       | Framer Motion                                           |
| Internationalization | next-intl v4                                        |
| Validation       | Zod v4                                                  |
| ID Generation    | @paralleldrive/cuid2                                    |
| Hosting          | Vercel                                                  |

---

## 2. Goals & Success Metrics

### Primary Goals

1. **Eliminate manual record-keeping** -- All member, attendance, and payment data lives in a single digital system.
2. **Accurate payment tracking** -- The owner can see at a glance who has credit, who owes money, and how much.
3. **Attendance visibility** -- Know which members are actually showing up and which are not.
4. **Flag under-attending members** -- Automatically identify members with fewer than 3 sessions per month for potential fee waivers.
5. **Member self-service** -- Members can view their own attendance, payment history, and schedule without asking the owner.

### Success Metrics

| Metric                        | Target                                                  |
| ----------------------------- | ------------------------------------------------------- |
| Admin time on record-keeping  | Reduced by 80%+ compared to manual notebooks            |
| Payment discrepancies         | Zero -- all cash payments logged digitally               |
| Attendance logging time       | Under 2 minutes per class session                       |
| Member balance accuracy       | 100% -- computed automatically from payment and tier data|
| Flagged member visibility     | Instant -- dashboard shows under-attending members       |
| Page load time                | Under 2 seconds on mobile                               |

---

## 3. User Personas

### Admin (Gym Owner)

- **Name archetype:** Coach / Owner
- **Context:** Runs the gym day-to-day. Teaches classes. Collects cash payments in person.
- **Needs:**
  - Quickly mark who attended each class.
  - Log cash payments immediately after receiving them.
  - See a dashboard with total members, attendance rates, monthly revenue.
  - Identify members who are paying but not attending (fee waiver candidates).
  - Manage the weekly class schedule.
  - Create login credentials for members.
- **Pain points:**
  - Loses track of payments in notebooks.
  - Cannot remember who attended which class last week.
  - Spends too much time on admin tasks instead of coaching.

### Member (Athlete)

- **Name archetype:** A BJJ / Kickboxing / MMA practitioner
- **Context:** Trains at the gym regularly. Pays monthly in cash.
- **Needs:**
  - View their weekly class schedule.
  - See their own attendance history and monthly count.
  - Check their payment balance (credit or debt).
  - Know their belt rank and membership tier.
- **Pain points:**
  - Cannot remember if they paid this month.
  - Does not know their attendance count without asking the coach.

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

**Login System**
- Username/password authentication via NextAuth v5 Credentials provider.
- JWT session strategy (no database sessions).
- Session payload includes: `id`, `username`, `role` ("admin" | "member"), `memberId`.
- Custom sign-in page at `/login`.

**Role-Based Access Control**
- Two roles: `admin` and `member`.
- Middleware-enforced route protection:
  - `/dashboard/*` routes require `role === "admin"`.
  - `/member/*` routes require `role === "member"`.
  - `/login` redirects authenticated users to their respective area.
- All other routes (landing page, public schedule) are publicly accessible.

**Credential Management**
- Admin creates login credentials for members from the member detail page.
- Validation: username minimum 3 characters, password minimum 6 characters.
- Passwords hashed with bcryptjs (12 salt rounds).
- Each user account links to a member profile via `memberId` foreign key.

### 4.2 Member Management

**Member CRUD**
- Admin can create, read, update, and deactivate members.
- Required fields: `fullName`, `membershipTierId`, `joinDate`.
- Optional fields: `phone`, `email`, `dateOfBirth`, `emergencyContact`, `notes`.
- Email validated as proper format when provided.

**Sport Enrollment**
- Members are enrolled in one or more sports via the `memberSports` junction table.
- Enrollment is validated against the member's tier:
  - **Basic** (sportsAllowed = 1): Maximum 1 sport.
  - **Standard** (sportsAllowed = 2): Maximum 2 sports.
  - **Premium** (sportsAllowed = -1): Unlimited sports (all 4).

**Belt Rank Tracking**
- Belt rank field with enum values: `white`, `blue`, `purple`, `brown`, `black`.
- Defaults to `white` for new members.
- Manually updated by admin as members progress.

**Activation / Deactivation**
- Members can be deactivated (soft delete) rather than permanently removed.
- The `isActive` boolean flag controls member status.
- Deactivated members are excluded from active counts and attendance workflows.

**Filtering & Search**
- Member list supports filtering by: sport, membership tier, active/inactive status.
- Search by member name.

### 4.3 Attendance Tracking

**Today's Classes**
- Attendance page shows today's scheduled classes based on the recurring schedule.
- Admin selects a class to open the attendance checklist.

**Class Session Auto-Creation**
- When attendance is marked for a scheduled slot, a `classSession` record is auto-created for that date if one does not already exist.
- Uniqueness constraint: one session per schedule slot per date.

**Attendance Checklist**
- For the selected class session, display all members enrolled in that sport.
- Admin toggles each member as present or absent.
- Bulk save of attendance records.

**Past Attendance Editing**
- Admin can select a past date to view and edit attendance for that day's classes.
- Useful for correcting mistakes or logging attendance retroactively.

**Monthly Attendance Counts**
- Each member's monthly session count is calculated and displayed.
- Format: "{count} sessions this month."

**Attendance Calendar Heatmap**
- Visual calendar showing attendance density per day/month.
- Available on both admin member detail and member dashboard views.

### 4.4 Payment Management

**Cash Payment Logging**
- Admin logs cash payments with the following fields:
  - `memberId` (required): Which member paid.
  - `amountMkd` (required): Amount in Macedonian Denars (MKD), positive integer.
  - `paymentDate` (required): Date the payment was received.
  - `monthFor` (required): The month the payment covers, in `YYYY-MM` format.
  - `notes` (optional): Free text.

**Balance Computation**
- Credit Balance = SUM(all payments) - (months_active * tier monthly price in MKD).
- Displayed as:
  - **Credit** (positive balance): Member has paid ahead.
  - **Owes / Debt** (negative balance): Member has outstanding dues.
  - **Settled** (zero balance): Member is current.

**Payment History**
- Full list of all payments for a member, showing date, amount, month covered, and notes.
- Accessible from both admin member detail and member dashboard views.

**Monthly Revenue Summary**
- Dashboard card showing total revenue collected in the current month.

### 4.5 Schedule Management

**Recurring Class Slots**
- CRUD for recurring weekly class slots.
- Each slot has: `sportId`, `dayOfWeek` (0=Sunday through 6=Saturday), `startTime` (HH:MM), `endTime` (HH:MM, optional).
- Slots can be activated/deactivated.

**Default Seed Schedule**
- Pre-seeded schedule covering Monday through Saturday:
  - Monday: BJJ 18:30-19:30, Kickboxing 19:30+
  - Tuesday: BJJ 19:00, MMA 20:00
  - Wednesday: Kickboxing 19:00
  - Thursday: BJJ 19:00, MMA 20:00
  - Saturday: BJJ 12:00, Kickboxing 13:00

**Weekly Grid View**
- Public-facing and admin-facing weekly schedule grid.
- Organized by day of week, showing sport, start time, and end time.

### 4.6 Dashboard (Admin)

**Stats Cards**
- Total Members (all registered members).
- Active Members (where `isActive = true`).
- Attendance Rate (percentage of present marks across sessions this month).
- Monthly Revenue (sum of payments logged for the current month).

**Flagged Members**
- Table listing members with fewer than 3 sessions in the current month.
- Columns: Member Name, Sessions Attended.
- Message "All members are on track this month" when no members are flagged.
- Purpose: Identify candidates for fee waivers or follow-up conversations.

**Recent Activity Feed**
- Chronological feed of recent payments.
- Format: "{member} paid {amount} for {month}."
- Shows "No recent activity" when empty.

### 4.7 Member Dashboard

A read-only area at `/member` for authenticated members.

- **Welcome message** with the member's name.
- **Quick Stats**: Attendance this month (session count), monthly fee, member since date, current tier.
- **Weekly Schedule**: The member's enrolled sports schedule for the week.
- **Attendance Calendar**: Personal attendance history with calendar heatmap.
- **Payment History**: Full list of the member's payments with amounts and dates.

### 4.8 Landing Page

A public-facing page at the root URL (`/`).

- **Hero Section**: Gym name "The Strongest Kumanovo", tagline "Train Hard. Fight Easy."
- **Sports Showcase**: Display of the 3 disciplines (BJJ, Kickboxing, MMA).
- **Weekly Schedule**: Public view of the class schedule grid.
- **Contact Information**: Gym location and contact details.
- **Sign In Link**: Navigation to `/login`.
- **Join Us CTA**: Call-to-action for prospective members.

### 4.9 Internationalization (i18n)

**Bilingual Support**
- Full English and Macedonian translations for all UI text.
- Translation files located at `/messages/en.json` and `/messages/mk.json`.

**Locale Resolution**
- Locale determined by a `locale` cookie.
- Defaults to `en` (English) if no cookie is set.
- Configured via next-intl plugin with `getRequestConfig`.

**Locale Switcher**
- UI toggle allowing users to switch between English and Macedonian.
- Persists the selection via cookie.

**Translation Coverage**
- All UI strings externalized: navigation, form labels, button text, status messages, sport names, tier names, belt rank names, day names, dashboard labels, error messages.

### 4.10 Settings

**Tier Pricing Management**
- Admin can update the monthly price (in MKD) for each membership tier.
- Displays current tier name, sports allowed count, and price.
- Validation: price must be a positive integer.

---

## 5. Non-Functional Requirements

### Performance
- Pages should load within 2 seconds on mobile connections.
- Deployed on Vercel for edge-optimized delivery.
- SQLite (Turso) provides low-latency reads for a single-gym workload.
- Server components used by default; client components only where interactivity is needed.

### Security
- Passwords hashed with bcryptjs using 12 salt rounds.
- JWT-based sessions (no sensitive data stored server-side).
- Middleware-enforced route protection: admin routes, member routes, and login redirect.
- All form inputs validated server-side with Zod schemas.
- CUID2 used for all primary keys (non-sequential, collision-resistant).
- Credentials created exclusively by admin (no self-registration).

### Accessibility
- Dark theme as the default and only theme (designed for the martial arts aesthetic).
- Mobile-first responsive design.
- Semantic HTML and proper form labels for screen reader compatibility.
- Keyboard-navigable interactive elements.

### Scalability
- Designed for single-gym use (one admin, up to ~200 members).
- Turso (hosted SQLite) is appropriate for this scale.
- No multi-tenancy or multi-gym abstractions.
- If the gym outgrows SQLite, Turso supports replicas and higher throughput tiers.

### Reliability
- Turso provides managed backups and replication.
- Vercel provides automatic deployments and rollbacks via Git integration.
- Unique constraints on critical junction tables prevent duplicate records.

---

## 6. Business Rules

### BR-1: Credit Balance Calculation

```
Credit Balance = SUM(payments.amountMkd) - (months_active * membershipTier.monthlyPriceMkd)
```

- **Positive balance** = Credit (member has paid ahead).
- **Negative balance** = Debt (member owes money).
- **Zero balance** = Settled.
- `months_active` is calculated from the member's `joinDate` to the current date.

### BR-2: Low Attendance Flag (<3 Sessions Rule)

- Members with fewer than 3 attendance records (where `present = true`) in the current calendar month are flagged on the admin dashboard.
- Purpose: These members may qualify for a fee waiver or need a check-in from the coach.
- Only active members are evaluated.

### BR-3: Tier-Based Sport Enrollment Validation

| Tier       | `sportsAllowed` | Meaning                        |
| ---------- | --------------- | ------------------------------ |
| Basic      | 1               | Member can enroll in 1 sport   |
| Standard   | 2               | Member can enroll in 2 sports  |
| Premium    | -1              | Member can enroll in all sports|

- When enrolling a member in sports, the count of selected sports must not exceed the tier's `sportsAllowed` value.
- A value of `-1` means unlimited (no restriction).
- If a member changes tiers, their sport enrollments must be re-validated.

### BR-4: Default Membership Tier Pricing

| Tier       | Monthly Price (MKD) | Sports Allowed |
| ---------- | ------------------- | -------------- |
| Basic      | 1,500 MKD           | 1              |
| Standard   | 2,500 MKD           | 2              |
| Premium    | 3,500 MKD           | All (unlimited)|

- Prices are editable by admin via the Settings page.
- All amounts are in Macedonian Denars (MKD).

### BR-5: Default Schedule Seed

The database is seeded with a default weekly schedule:

| Day       | Sport      | Start  | End    |
| --------- | ---------- | ------ | ------ |
| Monday    | BJJ        | 18:30  | 19:30  |
| Monday    | Kickboxing | 19:30  | --     |
| Tuesday   | BJJ        | 19:00  | --     |
| Tuesday   | MMA        | 20:00  | --     |
| Wednesday | Kickboxing | 19:00  | --     |
| Thursday  | BJJ        | 19:00  | --     |
| Thursday  | MMA        | 20:00  | --     |
| Saturday  | BJJ        | 12:00  | --     |
| Saturday  | Kickboxing | 13:00  | --     |

### BR-6: Class Session Uniqueness

- Only one `classSession` record can exist per `scheduleId` + `date` combination.
- Only one `attendance` record can exist per `memberId` + `classSessionId` combination.
- Enforced by database unique constraints.

### BR-7: Payment Month Format

- The `monthFor` field on payments must follow `YYYY-MM` format (e.g., "2026-02").
- Validated by Zod regex: `/^\d{4}-\d{2}$/`.

---

## 7. UI/UX Requirements

### Color Palette

| Token      | Hex       | Usage                                      |
| ---------- | --------- | ------------------------------------------ |
| Background | `#0A0A0A` | Page background, card backgrounds           |
| Red        | `#DC2626` | Primary accent, BJJ sport color, CTAs       |
| Gold       | `#EAB308` | Secondary accent, Kickboxing sport color    |
| White      | `#FAFAFA` | Primary text, headings                      |
| Blue       | `#2563EB` | Blue belt rank color                        |
| Green      | `#22C55E` | MMA sport color, success states             |

### Design Principles

- **Dark theme only** -- A dark, high-contrast design that fits the martial arts aesthetic.
- **Mobile-first** -- Layouts designed for phone screens first, then scale up for tablets and desktops.
- **Sport-coded colors** -- Each sport has a distinct color used consistently in schedule grids, attendance, and member cards.
- **Minimal chrome** -- Clean layouts with clear hierarchy. No unnecessary decoration.

### Animations & Transitions

- **Framer Motion** used for:
  - Page transitions (fade/slide between routes).
  - List item stagger animations (members, payments, attendance).
  - Card entrance animations on the dashboard.
  - Smooth modal and drawer open/close.
- **Loading skeletons** displayed during data fetches to prevent layout shift.
- **Toast notifications** for success/error feedback on form submissions.

### Responsive Breakpoints

- Mobile: < 640px (single column layouts).
- Tablet: 640px - 1024px (two column where appropriate).
- Desktop: > 1024px (sidebar navigation, multi-column grids).

### Navigation

- **Admin**: Sidebar navigation with links to Overview, Members, Attendance, Payments, Schedule, Settings, and Log Out.
- **Member**: Simplified navigation to My Dashboard and Log Out.
- **Public**: Landing page with Sign In link.

---

## 8. Out of Scope

The following features are explicitly **not** part of this project:

- **Online payment processing** -- The gym operates on cash only. No Stripe, PayPal, or card processing.
- **Multi-gym support** -- This is a single-gym application. No multi-tenancy.
- **SMS/email notifications** -- No automated messaging to members about payments, classes, or reminders.
- **Video/photo uploads** -- No media storage for techniques, progress photos, or gym content.
- **Advanced reporting/analytics** -- No trend charts, year-over-year comparisons, or exportable reports. The dashboard provides current-month snapshots only.
- **Bulk import/export** -- No CSV import of member lists or export of payment records.
- **Self-registration** -- Members cannot create their own accounts. Admin creates all credentials.
- **Class capacity limits** -- No maximum headcount per class session.
- **Automated fee waivers** -- The <3 attendance flag is informational only. No automatic pricing adjustments.
- **Competition/event management** -- No tournament brackets, event scheduling, or competition tracking.

---

## 9. Data Model Summary

The application uses 9 tables in a SQLite database (Turso). All primary keys are CUID2 strings.

### Tables

#### 1. `users` (Authentication)
| Column         | Type      | Notes                                  |
| -------------- | --------- | -------------------------------------- |
| id             | text (PK) | CUID2                                  |
| username       | text      | Unique, required                       |
| password_hash  | text      | bcrypt hash, required                  |
| role           | text      | "admin" or "member", default "member"  |
| member_id      | text (FK) | References `members.id`, nullable      |
| created_at     | integer   | Timestamp                              |

#### 2. `members` (Profile Data)
| Column             | Type      | Notes                                    |
| ------------------ | --------- | ---------------------------------------- |
| id                 | text (PK) | CUID2                                    |
| full_name          | text      | Required                                 |
| phone              | text      | Optional                                 |
| email              | text      | Optional, validated format               |
| date_of_birth      | text      | Optional                                 |
| emergency_contact  | text      | Optional                                 |
| membership_tier_id | text (FK) | References `membership_tiers.id`         |
| belt_rank          | text      | Enum: white/blue/purple/brown/black      |
| join_date          | text      | Required                                 |
| is_active          | integer   | Boolean, default true                    |
| notes              | text      | Optional                                 |
| created_at         | integer   | Timestamp                                |
| updated_at         | integer   | Timestamp                                |

#### 3. `sports`
| Column     | Type      | Notes                         |
| ---------- | --------- | ----------------------------- |
| id         | text (PK) | CUID2                         |
| name       | text      | Unique (BJJ, Kickboxing, etc.)|
| name_key   | text      | i18n translation key          |
| color      | text      | Hex color code                |
| created_at | integer   | Timestamp                     |

#### 4. `membership_tiers`
| Column            | Type      | Notes                              |
| ----------------- | --------- | ---------------------------------- |
| id                | text (PK) | CUID2                              |
| name              | text      | Unique (Basic, Standard, Premium)  |
| name_key          | text      | i18n translation key               |
| sports_allowed    | integer   | Max sports (-1 = unlimited)        |
| monthly_price_mkd | integer   | Price in MKD                       |
| is_active         | integer   | Boolean, default true              |
| updated_at        | integer   | Timestamp                          |

#### 5. `member_sports` (Junction Table)
| Column    | Type      | Notes                                      |
| --------- | --------- | ------------------------------------------ |
| id        | text (PK) | CUID2                                      |
| member_id | text (FK) | References `members.id`, cascade delete    |
| sport_id  | text (FK) | References `sports.id`, cascade delete     |
| *unique*  |           | Composite unique on (member_id, sport_id)  |

#### 6. `schedule` (Recurring Class Slots)
| Column      | Type      | Notes                            |
| ----------- | --------- | -------------------------------- |
| id          | text (PK) | CUID2                            |
| sport_id    | text (FK) | References `sports.id`, cascade  |
| day_of_week | integer   | 0 (Sunday) through 6 (Saturday) |
| start_time  | text      | HH:MM format                    |
| end_time    | text      | HH:MM format, optional          |
| is_active   | integer   | Boolean, default true            |
| created_at  | integer   | Timestamp                        |

#### 7. `class_sessions` (Actual Class Instances)
| Column      | Type      | Notes                                           |
| ----------- | --------- | ----------------------------------------------- |
| id          | text (PK) | CUID2                                           |
| schedule_id | text (FK) | References `schedule.id`                        |
| date        | text      | Date string                                     |
| notes       | text      | Optional                                        |
| created_at  | integer   | Timestamp                                       |
| *unique*    |           | Composite unique on (schedule_id, date)         |

#### 8. `attendance`
| Column           | Type      | Notes                                             |
| ---------------- | --------- | ------------------------------------------------- |
| id               | text (PK) | CUID2                                             |
| member_id        | text (FK) | References `members.id`, cascade delete           |
| class_session_id | text (FK) | References `class_sessions.id`, cascade delete    |
| present          | integer   | Boolean, default false                            |
| created_at       | integer   | Timestamp                                         |
| *unique*         |           | Composite unique on (member_id, class_session_id) |

#### 9. `payments`
| Column       | Type      | Notes                                    |
| ------------ | --------- | ---------------------------------------- |
| id           | text (PK) | CUID2                                    |
| member_id    | text (FK) | References `members.id`, cascade delete  |
| amount_mkd   | integer   | Positive integer, required               |
| payment_date | text      | Date string, required                    |
| month_for    | text      | YYYY-MM format, required                 |
| notes        | text      | Optional                                 |
| created_at   | integer   | Timestamp                                |

### Entity Relationship Summary

```
membership_tiers 1---* members
members          1---* member_sports *---1 sports
members          1---* attendance    *---1 class_sessions
members          1---* payments
schedule         1---* class_sessions
sports           1---* schedule
users            *---1 members (nullable)
```

---

## 10. Deployment

### Production Environment

| Component     | Service                    |
| ------------- | -------------------------- |
| Hosting       | Vercel (serverless)        |
| Database      | Turso (hosted libSQL)      |
| Domain        | Configured via Vercel      |
| Git Provider  | GitHub (auto-deploy on push)|

### Environment Variables

| Variable              | Description                          |
| --------------------- | ------------------------------------ |
| `TURSO_DATABASE_URL`  | Turso database connection URL        |
| `TURSO_AUTH_TOKEN`    | Turso authentication token           |
| `AUTH_SECRET`         | NextAuth session encryption secret   |

### Build & Deploy

- `npm run build` produces the production build.
- Vercel auto-deploys on pushes to the main branch.
- Database migrations managed via `drizzle-kit push`.
- Initial data seeded via `npx tsx src/db/seed.ts`.

### Database Initialization

1. Create a Turso database.
2. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables.
3. Run `npm run db:push` to apply the schema.
4. Run `npm run db:seed` to populate sports, tiers, default schedule, and admin account.
5. Default admin credentials: username `admin`, password `admin123` (change immediately after first login).

---

*This document describes the requirements for The Strongest Kumanovo gym management application. It is intended to serve as the single source of truth for what the application does and why.*
