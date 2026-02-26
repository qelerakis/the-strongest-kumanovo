# Source Directory Guide

## app/ - Pages (App Router)
- `layout.tsx`: Root layout. Wraps app in `NextIntlClientProvider`, loads Geist fonts, sets `className="dark"` on html element, applies `bg-surface text-text-primary` body classes.
- `template.tsx`: Framer Motion page transition wrapper. Fades in with opacity 0->1 and y 8->0 over 250ms.
- `page.tsx`: Public landing page (Hero, SportsShowcase, ScheduleDisplay, ContactSection).
- `login/page.tsx`: Shared login page for both admin and member users.
- `dashboard/`: Admin-only pages. Middleware redirects non-admin users to `/login`.
  - `page.tsx` - Overview: StatsCards, FlaggedMembers, RecentActivity
  - `members/page.tsx` - Member list with sport/tier/status filters
  - `members/new/page.tsx` - Add new member form
  - `members/[id]/page.tsx` - Member detail/edit view
  - `attendance/page.tsx` - Mark attendance: pick class, check off members
  - `payments/page.tsx` - Log payments, view balances and history
  - `schedule/page.tsx` - Edit weekly class schedule
  - `settings/page.tsx` - Tier pricing configuration
- `member/page.tsx`: Member-only read-only dashboard. Shows personal stats, schedule, attendance, payments.
- `api/auth/[...nextauth]/route.ts`: NextAuth API route handler.

## auth.ts - Authentication
NextAuth v5 config at `src/auth.ts`. Exports `{ handlers, signIn, signOut, auth }`.
- Credentials provider with bcryptjs password comparison.
- JWT strategy. Token stores `role`, `memberId`, `username`.
- Session exposes `user.id`, `user.username`, `user.role`, `user.memberId`.
- Custom sign-in page at `/login`.

## components/ - React Components
Organized by domain. Each directory maps to a feature area:

### ui/ - Reusable Primitives
`Button`, `Card`, `Input`, `Select`, `Badge`, `Checkbox`, `Dialog`, `Table`, `Toast`, `Skeleton`

### layout/ - App Shells and Navigation
- `DashboardShell` - Admin layout with sidebar and header
- `MemberShell` - Member layout
- `Header` - Top bar with user info
- `Sidebar` - Admin navigation sidebar
- `MobileNav` - Mobile hamburger navigation
- `LocaleSwitcher` - EN/MK language toggle (sets cookie via `locale` server action)

### members/
- `MemberForm` - Create/edit member form (uses `memberSchema` validator)
- `MemberList` - Filterable table of all members
- `MemberCard` - Member summary card
- `BeltRankBadge` - Colored badge for belt rank display

### attendance/
- `ClassPicker` - Select today's class (or past date's class) to mark attendance
- `AttendanceChecklist` - Checkbox list of members for a class session
- `AttendanceCalendar` - Visual calendar showing attendance history
- `AttendancePageClient` - Client wrapper orchestrating class picker + checklist

### payments/
- `PaymentForm` - Log a cash payment (member, amount, date, month-for)
- `PaymentHistory` - Table of past payments for a member
- `BalanceDisplay` - Shows computed credit/debt balance
- `PaymentsOverview` - Admin view of all members' payment status
- `TierPricingForm` - Edit monthly price for a tier (uses `tierPricingSchema`)

### schedule/
- `ScheduleEditor` - Add/edit/delete class slots
- `WeeklyGrid` - Visual weekly schedule grid grouped by day

### dashboard/
- `StatsCards` - Total members, active members, attendance rate, monthly revenue
- `FlaggedMembers` - Members with <3 sessions this month
- `RecentActivity` - Latest payments and attendance events

### landing/
- `Hero` - Landing page hero section
- `SportsShowcase` - Display of the 4 sports
- `ScheduleDisplay` - Public-facing weekly schedule
- `ContactSection` - Gym contact info

### motion/
- `PageTransition` - Framer Motion page wrapper
- `FadeIn` - Fade-in animation wrapper
- `StaggerChildren` - Staggered entrance animation for lists

## db/ - Database

### schema.ts - Table Definitions
9 tables with CUID2 primary keys:

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | username, passwordHash, role (admin/member), memberId? | Auth accounts. Admin has no memberId. |
| `members` | fullName, phone?, email?, dateOfBirth?, emergencyContact?, membershipTierId, beltRank?, joinDate, isActive, notes? | Core member profiles. |
| `sports` | name, nameKey, color? | 4 sports: BJJ, Kickboxing, Wrestling, MMA. |
| `membership_tiers` | name, nameKey, sportsAllowed, monthlyPriceMkd, isActive | Basic/Standard/Premium. sportsAllowed=-1 means unlimited. |
| `member_sports` | memberId, sportId | Junction table. Unique(memberId, sportId). |
| `schedule` | sportId, dayOfWeek (0-6), startTime, endTime?, isActive | Recurring weekly class slots. |
| `class_sessions` | scheduleId, date, notes? | Actual class instances. Unique(scheduleId, date). |
| `attendance` | memberId, classSessionId, present | Unique(memberId, classSessionId). |
| `payments` | memberId, amountMkd, paymentDate, monthFor (YYYY-MM), notes? | Cash payment records. |

### index.ts - Connection
Creates libSQL client from `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`, wraps with Drizzle ORM. Exports `db`.

### seed.ts - Database Seeder
Run with `npm run db:seed`. Seeds:
- 4 sports (BJJ red, Kickboxing gold, Wrestling blue, MMA green)
- 3 tiers (Basic 1500, Standard 2500, Premium 3500 MKD)
- Admin user (admin / admin123)
- Default weekly schedule (8 class slots across Mon/Tue/Wed/Thu/Sat)

## lib/ - Business Logic

### actions/ - Server Actions (Mutations)
All server actions use `"use server"` directive. Pattern: validate input with Zod, check auth session, perform DB operation, call `revalidatePath()`.
- `members.ts` - createMember, updateMember, toggleMemberStatus, createMemberCredentials
- `attendance.ts` - saveAttendance (upserts attendance records for a class session)
- `payments.ts` - createPayment
- `schedule.ts` - createScheduleSlot, updateScheduleSlot, deleteScheduleSlot
- `auth.ts` - login (calls signIn), logout (calls signOut)
- `settings.ts` - updateTierPricing
- `locale.ts` - setLocale (sets cookie)

### queries/ - Data Fetching (Reads)
Pure read functions for Server Components. No mutations. Pattern: query DB with Drizzle, return typed data.
- `members.ts` - getMember, getMembers, getMemberWithSports
- `attendance.ts` - getAttendanceForSession, getMemberAttendance, getMonthlyAttendanceCount
- `payments.ts` - getMemberPayments, getMemberBalance, getAllMemberBalances
- `schedule.ts` - getSchedule, getTodaySchedule, getScheduleForDay
- `dashboard.ts` - getDashboardStats, getFlaggedMembers, getRecentActivity
- `settings.ts` - getTiers, getTier

### utils.ts - Utility Functions
- `formatMKD(amount)` - Format number as "1,500 MKD"
- `formatDate(date)` - ISO date to "25 Feb 2026"
- `formatTime(time)` - "18:30" to "6:30 PM"
- `getCurrentMonth()` - Returns "YYYY-MM" for current month
- `cn(...classes)` - Merge CSS class names, filtering falsy values
- `getMonthsBetween(start, end)` - Array of "YYYY-MM" strings between two dates

### validators.ts - Zod Schemas
- `memberSchema` - fullName (required), phone?, email?, dateOfBirth?, emergencyContact?, membershipTierId (required), beltRank?, joinDate (required), notes?
- `paymentSchema` - memberId, amountMkd (positive int), paymentDate, monthFor (YYYY-MM regex), notes?
- `scheduleSchema` - sportId, dayOfWeek (0-6), startTime (HH:MM), endTime? (HH:MM)
- `credentialsSchema` - username (min 3), password (min 6)
- `tierPricingSchema` - monthlyPriceMkd (positive int)

## i18n/ - Internationalization
- `request.ts`: next-intl server config. Reads `locale` cookie (defaults to "en"), loads matching JSON from `messages/`.

## types/ - TypeScript Types
- `UserRole`: "admin" | "member"
- `BeltRank`: "white" | "blue" | "purple" | "brown" | "black"
- `DayOfWeek`: 0-6
- `DAY_NAMES`: string array ["Sunday", ..., "Saturday"]
- `BELT_COLORS`: Record mapping BeltRank to hex color

## Key Relationships
```
users --> members (1:1 optional, via users.memberId. Admin user has null memberId)
members --> membership_tiers (N:1, via members.membershipTierId)
members <-> sports (M:N, via member_sports junction table)
schedule --> sports (N:1, via schedule.sportId)
class_sessions --> schedule (N:1, via classSessions.scheduleId)
attendance --> members + class_sessions (N:1 each)
payments --> members (N:1, via payments.memberId)
```
