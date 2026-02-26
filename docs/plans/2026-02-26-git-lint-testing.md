# Git Init, Lint Fixes, and Comprehensive Testing Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize git, fix all lint errors, set up Vitest, and write comprehensive unit tests for the gym management app.

**Architecture:** Pure functions (utils, validators) are tested directly. Database queries and server actions are tested against a real test SQLite database with setup/teardown per test suite. Server actions that use Next.js internals (`revalidatePath`, `signIn`) are tested with mocked modules.

**Tech Stack:** Vitest, @libsql/client (file:test.db), drizzle-orm

---

## Task 1: Initialize Git Repository

**Files:**
- Create: `.gitignore` (verify/update existing)

**Step 1: Verify .gitignore exists and is correct**

Ensure `.gitignore` includes:
```
node_modules/
.next/
local.db
test.db
.env.local
.env
*.tsbuildinfo
```

**Step 2: Initialize git and make initial commit**

```bash
cd "D:/The Strongest Kumanovo"
git init
git add -A
git commit -m "chore: initial commit - MVP gym management app"
```

---

## Task 2: Fix Lint Errors (6 issues)

**Files:**
- Modify: `src/components/payments/payment-form.tsx` (lines 52-64)
- Modify: `src/components/schedule/schedule-editor.tsx` (lines 61-70)
- Modify: `src/app/dashboard/payments/page.tsx` (line 11)
- Modify: `src/components/attendance/attendance-calendar.tsx` (line 48)
- Modify: `src/lib/queries/members.ts` (line 3)
- Modify: `src/lib/queries/payments.ts` (line 3)

### Fix 2a: payment-form.tsx - setState in useEffect

Replace the useEffect (lines 52-64) that sets state synchronously with a key-based reset pattern. Remove the useEffect entirely and reset form state using a `key` prop on the dialog, or move the initialization into the open handler.

**Fix approach:** Use a `ref` to track previous `isOpen` state and only reset when transitioning from closed to open, using a callback pattern that avoids the lint rule:

```tsx
// Replace the useEffect block (lines 52-64) with:
const prevIsOpenRef = useRef(false);
if (isOpen && !prevIsOpenRef.current) {
  // Reset form when dialog opens (render-time state sync, not effect)
}
prevIsOpenRef.current = isOpen;
```

Actually, simplest fix: move initialization into a `handleOpen` function and reset state there, or derive initial state from props. Since the Dialog's `onOpenChange` is already handled, we can reset in the component body during render when `isOpen` transitions.

**Best fix:** Convert to use a `key` prop at the call site to force remount, OR use the simpler pattern of initializing state from props and resetting via the close handler. Since we can't change call sites, use the render-time sync pattern.

### Fix 2b: schedule-editor.tsx - setState in useEffect

Same pattern as 2a. Replace lines 61-70 with render-time state sync.

### Fix 2c: payments/page.tsx - unused `t` variable

Remove `t` from the destructured Promise.all result at line 11, or remove the `getTranslations("payments")` call entirely since `t` isn't used in the JSX.

### Fix 2d: attendance-calendar.tsx - unused `t` variable

Remove `const t = useTranslations("attendance")` at line 48 since `t` is never used in the component.

### Fix 2e: queries/members.ts - unused `sql` import

Remove `sql` from the import at line 3: `import { eq, and, like, sum } from "drizzle-orm"`

### Fix 2f: queries/payments.ts - unused `sql` import

Remove `sql` from the import at line 3: `import { eq, desc, sum } from "drizzle-orm"`

**Step: Run lint to verify all issues fixed**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings

**Step: Commit**

```bash
git add -A
git commit -m "fix: resolve all lint errors and warnings"
```

---

## Task 3: Set Up Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/db-setup.ts`
- Modify: `package.json` (add test scripts)
- Modify: `tsconfig.json` (include test types if needed)

**Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

**Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      include: ["src/lib/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

**Step 3: Create src/test/setup.ts**

```typescript
// Global test setup
// Will be expanded with db setup/teardown
```

**Step 4: Create src/test/db-setup.ts**

Test helper that creates a fresh test database, runs schema push, and provides seed helpers:

```typescript
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { hashSync } from "bcryptjs";

export function createTestDb() {
  const client = createClient({ url: "file:test.db" });
  return drizzle(client, { schema });
}

// Seed functions for test data
export function createTestSport(overrides = {}) { ... }
export function createTestTier(overrides = {}) { ... }
export function createTestMember(overrides = {}) { ... }
// etc.
```

**Step 5: Add test scripts to package.json**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 6: Run to verify vitest works**

```bash
npm test
```

Expected: "No test files found" (no tests yet, but framework works)

**Step: Commit**

```bash
git add -A
git commit -m "chore: set up vitest testing framework"
```

---

## Task 4: Unit Tests for Utility Functions

**Files:**
- Create: `src/lib/utils.test.ts`
- Test: `src/lib/utils.ts`

These are pure functions - no mocking needed.

**Tests to write:**

```typescript
// formatMKD
- formatMKD(1500) => "1,500 MKD"
- formatMKD(0) => "0 MKD"
- formatMKD(3500000) => "3,500,000 MKD"

// formatDate
- formatDate("2026-02-25") => "25 Feb 2026"
- formatDate("2025-12-01") => "1 Dec 2025"

// formatTime
- formatTime("18:30") => "6:30 PM"
- formatTime("09:00") => "9:00 AM"
- formatTime("00:00") => "12:00 AM"
- formatTime("12:00") => "12:00 PM"

// getCurrentMonth
- returns YYYY-MM format matching current date

// cn
- cn("a", "b") => "a b"
- cn("a", false, "b") => "a b"
- cn("a", null, undefined, "b") => "a b"

// getMonthsBetween
- getMonthsBetween("2025-10-15", "2026-01-05") => ["2025-10", "2025-11", "2025-12", "2026-01"]
- getMonthsBetween("2026-03-01", "2026-03-31") => ["2026-03"]
- getMonthsBetween("2025-11-01", "2025-11-30") => ["2025-11"]
- handles year boundary correctly
```

**Step: Run tests**

```bash
npm test src/lib/utils.test.ts
```

**Step: Commit**

```bash
git add src/lib/utils.test.ts
git commit -m "test: add unit tests for utility functions"
```

---

## Task 5: Unit Tests for Zod Validators

**Files:**
- Create: `src/lib/validators.test.ts`
- Test: `src/lib/validators.ts`

Pure validation logic - no mocking needed.

**Tests to write:**

```typescript
// memberSchema
- valid: full data passes
- valid: minimal required fields only (fullName, membershipTierId, joinDate)
- invalid: missing fullName
- invalid: missing membershipTierId
- invalid: missing joinDate
- invalid: bad email format
- valid: empty string email passes (optional)
- valid: all belt ranks accepted
- invalid: unknown belt rank rejected

// paymentSchema
- valid: complete payment data
- invalid: missing memberId
- invalid: amountMkd <= 0
- invalid: amountMkd is float
- invalid: bad monthFor format (not YYYY-MM)
- valid: "2026-02" monthFor format

// scheduleSchema
- valid: full schedule data
- invalid: missing sportId
- invalid: dayOfWeek < 0 or > 6
- invalid: bad startTime format
- valid: empty endTime string
- valid: endTime omitted

// credentialsSchema
- valid: username 3+ chars, password 6+ chars
- invalid: username < 3 chars
- invalid: password < 6 chars

// tierPricingSchema
- valid: positive integer
- invalid: 0
- invalid: negative
- invalid: float
```

**Step: Run tests**

```bash
npm test src/lib/validators.test.ts
```

**Step: Commit**

```bash
git add src/lib/validators.test.ts
git commit -m "test: add unit tests for Zod validators"
```

---

## Task 6: Unit Tests for Database Queries

**Files:**
- Create: `src/lib/queries/members.test.ts`
- Create: `src/lib/queries/payments.test.ts`
- Create: `src/lib/queries/attendance.test.ts`
- Create: `src/lib/queries/dashboard.test.ts`
- Create: `src/lib/queries/schedule.test.ts`
- Modify: `src/test/db-setup.ts` (add seed helpers)

These tests need a real test database. The approach:
1. Before each test suite: create fresh test.db, push schema, seed data
2. After each test suite: clean up test.db
3. Mock `@/db` module to return test db instance

**Key test scenarios:**

### members queries
- getAllMembers() returns all members with sports
- getAllMembers({ isActive: true }) filters inactive
- getAllMembers({ search: "John" }) filters by name
- getAllMembers({ sportId: "..." }) filters by sport
- getMemberById() returns member with sports and user
- getMemberById() returns null for non-existent ID
- getMemberBalance() computes correct balance (credit case)
- getMemberBalance() computes correct balance (debt case)

### payments queries
- getPaymentsForMember() returns payments ordered by date desc
- getPaymentsSummary() computes per-member totals for month

### attendance queries
- getClassSessionsForDate() returns existing sessions
- getClassSessionsForDate() auto-creates from schedule
- getAttendanceForSession() returns records with names
- getMemberAttendanceHistory() returns recent history
- getMonthlyAttendanceCount() counts correctly

### dashboard queries
- getDashboardStats() returns correct aggregates
- getFlaggedMembers() returns members with <3 attendances
- getRecentPayments() returns limited recent payments

### schedule queries
- getFullSchedule() returns grouped by day
- getScheduleForDay() returns slots for specific day

**Step: Commit after each test file passes**

---

## Task 7: Unit Tests for Server Actions

**Files:**
- Create: `src/lib/actions/members.test.ts`
- Create: `src/lib/actions/payments.test.ts`
- Create: `src/lib/actions/attendance.test.ts`
- Create: `src/lib/actions/schedule.test.ts`
- Create: `src/lib/actions/settings.test.ts`

These need:
- Test database (same as Task 6)
- Mocked `next/cache` (`revalidatePath`)
- Mocked `@/auth` (`signIn`, `signOut`) for auth actions

**Key test scenarios:**

### members actions
- createMember: valid data creates member + sports
- createMember: invalid data returns validation error
- updateMember: updates fields and sports
- toggleMemberStatus: flips isActive
- deleteMember: removes member (cascades)

### payments actions
- logPayment: valid data creates payment
- logPayment: invalid amount returns error
- deletePayment: removes payment

### attendance actions
- openClassSession: creates new session
- openClassSession: returns existing session (idempotent)
- markAttendance: records present/absent for all members

### schedule actions
- addClassSlot: creates slot with valid data
- addClassSlot: rejects invalid data
- updateClassSlot: modifies existing slot
- removeClassSlot: deletes slot

### settings actions
- updateTierPricing: updates price with valid data
- updateTierPricing: rejects invalid price

**Step: Commit after each test file passes**

---

## Task 8: Run Full Test Suite and Verify

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass.

**Step 2: Run with coverage**

```bash
npm run test:coverage
```

**Step 3: Run build to verify no regressions**

```bash
npm run build
```

**Step 4: Run lint**

```bash
npm run lint
```

**Step 5: Final commit**

```bash
git add -A
git commit -m "test: comprehensive unit test suite complete"
```

---

## Task 9: Code Review

Use `superpowers:requesting-code-review` to review:
1. All test files for quality
2. All lint fixes for correctness
3. Overall code quality assessment
4. Security review (auth, input validation)
5. Performance review (N+1 queries, missing indexes)

---

## Execution Notes

- **Test DB isolation:** Each query/action test file should use its own seeded data. Use `beforeAll`/`afterAll` for DB lifecycle.
- **Mocking strategy:** Mock `@/db` to point to test database. Mock `next/cache` and `@/auth` for server actions.
- **No component tests:** Focus on business logic (utils, validators, queries, actions). Component tests would require jsdom + React testing library which adds complexity.
