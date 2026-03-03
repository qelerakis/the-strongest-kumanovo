# Attendance UI Fix & Advance Payments Design

**Date:** 2026-03-03
**Status:** Approved

---

## 1. Attendance Date Picker UI Fix

### Problem
On desktop, the DatePicker in the attendance ClassPicker header is pushed to the far right by `justify-between`. The date text inside the trigger button is crammed against the calendar icon.

### Solution

**`src/components/attendance/class-picker.tsx`:**
- Change header from `flex items-center justify-between` to left-aligned flow
- Title and DatePicker sit next to each other, left-aligned with gap

**`src/components/ui/date-picker.tsx`:**
- Add `gap-2` between date text and calendar icon inside the trigger button

### Result
Header reads as "Today's Classes [3 Mar 2026 icon]" flowing left-to-right with comfortable spacing.

---

## 2. Advance Payment Feature

### Overview
Allow admin to log a single payment that covers multiple months. The system auto-splits into separate payment records per month.

### UX Flow
1. Admin opens "Log Payment" form
2. Selects a member
3. Selects "Number of months" (dropdown: 1–6, default 1)
4. Selects "Starting month" (month picker, defaults to current month)
5. Amount auto-fills: `tierPrice x numberOfMonths`
6. Hint shown below amount: "Expected: 4,500 MKD (1,500 x 3)"
7. Admin can override amount
8. On submit, system creates N payment records

### Split Logic
- Each month gets `tierPrice` as its amount
- Last month gets `totalAmount - (tierPrice * (N-1))` (absorbs remainder)
- Example: 4,000 MKD for 3 months at 1,500/mo = 1,500 + 1,500 + 1,000

### Notes Generation
- Auto-generated: "Advance payment 1/3", "Advance payment 2/3", etc.
- If admin adds custom note: "Advance payment 1/3 — [custom note]"
- When numberOfMonths is 1: no auto-prefix, behaves like today

### File Changes

**`src/components/payments/payment-form.tsx`:**
- Add "Number of months" select (1–6)
- Auto-calculate amount when member + months selected
- Show expected amount hint when months > 1
- Rename "Month For" label to "Starting Month"
- Pass numberOfMonths to server action

**`src/lib/actions/payments.ts` — `logPayment()`:**
- Accept `numberOfMonths` (default 1)
- When > 1: loop to create N records with month incrementing
- Apply split logic (tier price per month, remainder on last)
- Generate auto-notes with "Advance payment X/N" prefix

**`src/lib/validators.ts`:**
- Add `numberOfMonths: z.number().int().min(1).max(6).default(1)` to paymentSchema

**`messages/en.json` & `messages/mk.json`:**
- Add: "numberOfMonths", "startingMonth", "expectedAmount", "advancePayment"

### What Does NOT Change
- Database schema (no new tables or columns)
- Payment queries (they sum records as before)
- Balance calculation logic (computed from raw payment records)
- PaymentHistory display (each split record is a normal payment row)
- BalanceDisplay component
