# Attendance UI Fix & Advance Payments — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the attendance date picker layout/spacing on desktop and add advance multi-month payment support.

**Architecture:** Two independent changes. (1) CSS-only fix in class-picker and date-picker trigger button. (2) Advance payments extend the existing payment form + server action with a `numberOfMonths` field that auto-splits into N payment records.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM, Zod 4, next-intl

---

## Task 1: Fix DatePicker trigger button spacing

**Files:**
- Modify: `src/components/ui/date-picker.tsx:272-286`

**Step 1: Edit the trigger button**

In `src/components/ui/date-picker.tsx`, the trigger button (line ~272-286) currently uses `justify-between` with no explicit gap. Change it to use `gap-2` so the date text and calendar icon have breathing room.

Replace:
```tsx
<button
  id={inputId}
  type="button"
  onClick={() => setOpen((prev) => !prev)}
  className={`flex w-full items-center justify-between rounded-lg border bg-surface-card px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface ${
    error
      ? "border-error focus:ring-error"
      : "border-surface-border hover:border-text-muted"
  } ${open ? "ring-2 ring-brand-red ring-offset-1 ring-offset-surface" : ""}`}
>
  <span className={value ? "text-text-primary" : "text-text-muted"}>
    {value ? formatDisplayValue() : placeholder ?? (mode === "date" ? "Select date" : "Select month")}
  </span>
  <CalendarIcon />
</button>
```

With:
```tsx
<button
  id={inputId}
  type="button"
  onClick={() => setOpen((prev) => !prev)}
  className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-surface-card px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface ${
    error
      ? "border-error focus:ring-error"
      : "border-surface-border hover:border-text-muted"
  } ${open ? "ring-2 ring-brand-red ring-offset-1 ring-offset-surface" : ""}`}
>
  <span className={value ? "text-text-primary" : "text-text-muted"}>
    {value ? formatDisplayValue() : placeholder ?? (mode === "date" ? "Select date" : "Select month")}
  </span>
  <CalendarIcon />
</button>
```

The only change is adding `gap-2` to the className.

**Step 2: Verify visually**

Open `http://localhost:3333/dashboard/attendance` — the date button should now have comfortable space between the date text and calendar icon.

**Step 3: Commit**

```bash
git add src/components/ui/date-picker.tsx
git commit -m "fix: add gap between date text and calendar icon in DatePicker trigger"
```

---

## Task 2: Fix ClassPicker header layout — left-align date picker

**Files:**
- Modify: `src/components/attendance/class-picker.tsx:43-51`

**Step 1: Change header from justify-between to left-aligned flow**

In `src/components/attendance/class-picker.tsx`, the header div (line ~43) currently uses `justify-between` which pushes the DatePicker all the way to the right on desktop. Change to a left-aligned flow with a gap.

Replace:
```tsx
<div className="flex items-center justify-between gap-4 flex-wrap">
  <h2 className="text-lg font-semibold text-text-primary">
    {t("todayClasses")}
  </h2>
  <DatePicker
    value={selectedDate}
    onChange={onDateChange}
  />
</div>
```

With:
```tsx
<div className="flex items-center gap-4 flex-wrap">
  <h2 className="text-lg font-semibold text-text-primary">
    {t("todayClasses")}
  </h2>
  <DatePicker
    value={selectedDate}
    onChange={onDateChange}
    className="w-auto"
  />
</div>
```

Two changes: (1) Remove `justify-between` so items flow left. (2) Add `className="w-auto"` on the DatePicker so it doesn't stretch to fill remaining space (it defaults to `w-full`).

**Step 2: Verify visually**

Open `http://localhost:3333/dashboard/attendance` — the title and date picker should now sit next to each other on the left, reading naturally as "Today's Classes [3 Mar 2026 📅]".

**Step 3: Commit**

```bash
git add src/components/attendance/class-picker.tsx
git commit -m "fix: left-align date picker next to title in attendance header"
```

---

## Task 3: Add translation keys for advance payments

**Files:**
- Modify: `messages/en.json:144-159` (payments section)
- Modify: `messages/mk.json:144-159` (payments section)

**Step 1: Add EN translation keys**

In `messages/en.json`, add these keys inside the `"payments"` object (after `"member": "Member"`):

```json
"numberOfMonths": "Number of Months",
"startingMonth": "Starting Month",
"expectedAmount": "Expected: {amount} ({price} x {months})",
"advancePayment": "Advance payment {current}/{total}"
```

**Step 2: Add MK translation keys**

In `messages/mk.json`, add these keys inside the `"payments"` object (after `"member": "Член"`):

```json
"numberOfMonths": "Број на месеци",
"startingMonth": "Почетен месец",
"expectedAmount": "Очекувано: {amount} ({price} x {months})",
"advancePayment": "Авансно плаќање {current}/{total}"
```

**Step 3: Commit**

```bash
git add messages/en.json messages/mk.json
git commit -m "feat: add advance payment translation keys (EN/MK)"
```

---

## Task 4: Add `numberOfMonths` to Zod payment validator

**Files:**
- Modify: `src/lib/validators.ts:18-26`

**Step 1: Add numberOfMonths field to paymentSchema**

In `src/lib/validators.ts`, add a `numberOfMonths` field to `paymentSchema`. This field defaults to 1 so existing single-month calls still work without changes.

Replace:
```ts
export const paymentSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amountMkd: z.number().int().positive("Amount must be a positive integer"),
  paymentDate: z.string().min(1, "Payment date is required"),
  monthFor: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format"),
  notes: z.string().optional(),
});
```

With:
```ts
export const paymentSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amountMkd: z.number().int().positive("Amount must be a positive integer"),
  paymentDate: z.string().min(1, "Payment date is required"),
  monthFor: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format"),
  numberOfMonths: z.number().int().min(1).max(6).default(1),
  notes: z.string().optional(),
});
```

**Step 2: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat: add numberOfMonths field to payment validator (1-6, default 1)"
```

---

## Task 5: Update `logPayment` server action for multi-month split

**Files:**
- Modify: `src/lib/actions/payments.ts`

**Step 1: Add month-incrementing utility**

Add a helper function at the top of the file (after imports) to increment a "YYYY-MM" string by N months:

```ts
/** Increment a "YYYY-MM" string by `offset` months */
function incrementMonth(yearMonth: string, offset: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(y, m - 1 + offset, 1);
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${newYear}-${newMonth}`;
}
```

**Step 2: Update logPayment to handle multi-month split**

Replace the entire `logPayment` function body with logic that:
1. Parses `numberOfMonths` from formData (default 1)
2. When `numberOfMonths` is 1: behaves exactly as before (single insert)
3. When `numberOfMonths` > 1:
   - Looks up the member's tier price from the DB
   - Calculates per-month amount: `tierPrice` for months 1..(N-1), remainder for month N
   - Generates notes: "Advance payment 1/N — [user note]"
   - Inserts N records in a loop, incrementing `monthFor`

```ts
export async function logPayment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const raw = {
      memberId: formData.get("memberId") as string,
      amountMkd: Number(formData.get("amountMkd")),
      paymentDate: formData.get("paymentDate") as string,
      monthFor: formData.get("monthFor") as string,
      numberOfMonths: Number(formData.get("numberOfMonths") || 1),
      notes: (formData.get("notes") as string) || undefined,
    };

    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const { memberId, amountMkd, paymentDate, monthFor, numberOfMonths, notes } = parsed.data;

    if (numberOfMonths === 1) {
      // Single month — existing behavior
      await db.insert(schema.payments).values({
        memberId,
        amountMkd,
        paymentDate,
        monthFor,
        notes: notes ?? null,
      });
    } else {
      // Multi-month advance payment — look up tier price for split
      const memberResult = await db
        .select({ tierPrice: schema.membershipTiers.monthlyPriceMkd })
        .from(schema.members)
        .innerJoin(
          schema.membershipTiers,
          eq(schema.members.membershipTierId, schema.membershipTiers.id)
        )
        .where(eq(schema.members.id, memberId))
        .limit(1);

      const tierPrice = memberResult[0]?.tierPrice ?? 0;

      for (let i = 0; i < numberOfMonths; i++) {
        const isLast = i === numberOfMonths - 1;
        const monthAmount = isLast
          ? amountMkd - tierPrice * (numberOfMonths - 1)
          : tierPrice;

        const advanceLabel = `Advance payment ${i + 1}/${numberOfMonths}`;
        const monthNotes = notes
          ? `${advanceLabel} — ${notes}`
          : advanceLabel;

        await db.insert(schema.payments).values({
          memberId,
          amountMkd: monthAmount,
          paymentDate,
          monthFor: incrementMonth(monthFor, i),
          notes: monthNotes,
        });
      }
    }

    revalidatePath("/dashboard/payments");
    return { success: true };
  } catch (error) {
    console.error("Failed to log payment:", error);
    return { success: false, error: "Failed to log payment" };
  }
}
```

**Step 3: Verify build**

```bash
npm run build
```

Should compile without errors.

**Step 4: Commit**

```bash
git add src/lib/actions/payments.ts
git commit -m "feat: logPayment supports multi-month split with advance payment notes"
```

---

## Task 6: Pass tier price data to PaymentForm

**Files:**
- Modify: `src/app/dashboard/payments/page.tsx`
- Modify: `src/components/payments/payments-overview.tsx`

**Step 1: Enrich member options with tier price**

In `src/app/dashboard/payments/page.tsx`, the `memberOptions` array currently only has `id` and `fullName`. Add `tierPrice` so the payment form can auto-calculate.

Replace:
```tsx
const memberOptions = allMembers.map((m) => ({
  id: m.id,
  fullName: m.fullName,
}));
```

With:
```tsx
const memberOptions = allMembers.map((m) => ({
  id: m.id,
  fullName: m.fullName,
  tierPrice: m.tierPrice,
}));
```

**Step 2: Update PaymentsOverview `MemberOption` interface**

In `src/components/payments/payments-overview.tsx`, update the `MemberOption` interface:

Replace:
```tsx
interface MemberOption {
  id: string;
  fullName: string;
}
```

With:
```tsx
interface MemberOption {
  id: string;
  fullName: string;
  tierPrice: number;
}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/payments/page.tsx src/components/payments/payments-overview.tsx
git commit -m "feat: pass tierPrice in member options for auto-calculation"
```

---

## Task 7: Update PaymentForm with advance payment UI

**Files:**
- Modify: `src/components/payments/payment-form.tsx`

This is the largest task. The form needs:
1. Updated `MemberOption` interface with `tierPrice`
2. A `numberOfMonths` state (default 1)
3. A Select dropdown for number of months (1–6)
4. Auto-fill amount when member + months changes
5. Expected amount hint when months > 1
6. "Month For" label changed to "Starting Month" when months > 1
7. Pass `numberOfMonths` in formData

**Step 1: Update the MemberOption interface**

In `src/components/payments/payment-form.tsx`, update:

```tsx
interface MemberOption {
  id: string;
  fullName: string;
}
```

To:

```tsx
interface MemberOption {
  id: string;
  fullName: string;
  tierPrice: number;
}
```

**Step 2: Add state and auto-calculation**

Inside `PaymentFormInner`, add after the existing state variables:

```tsx
const [numberOfMonths, setNumberOfMonths] = useState(1);
```

Add an auto-calculation effect. After the state declarations, add:

```tsx
// Auto-calculate amount when member or numberOfMonths changes
const selectedMember = members.find((m) => m.id === memberId);
const expectedAmount = selectedMember ? selectedMember.tierPrice * numberOfMonths : 0;

// Auto-fill amount when member or months change
const [autoFilled, setAutoFilled] = useState(false);
const prevMemberId = useRef(memberId);
const prevMonths = useRef(numberOfMonths);

if (prevMemberId.current !== memberId || prevMonths.current !== numberOfMonths) {
  prevMemberId.current = memberId;
  prevMonths.current = numberOfMonths;
  if (selectedMember && numberOfMonths >= 1) {
    setAmountMkd(String(selectedMember.tierPrice * numberOfMonths));
    setAutoFilled(true);
  }
}
```

Add `useRef` to the import from React (already imported `useState` and `useTransition`).

**Step 3: Add numberOfMonths Select to the form**

After the member select block and before the amount Input, add:

```tsx
{/* Number of months */}
<Select
  label={t("numberOfMonths")}
  value={String(numberOfMonths)}
  onChange={(e) => setNumberOfMonths(Number(e.target.value))}
>
  {[1, 2, 3, 4, 5, 6].map((n) => (
    <option key={n} value={n}>
      {n}
    </option>
  ))}
</Select>
```

**Step 4: Add expected amount hint below the amount Input**

After the `<Input label={t("amount")} ... />` block, add:

```tsx
{numberOfMonths > 1 && selectedMember && (
  <p className="text-xs text-text-muted -mt-2">
    {t("expectedAmount", {
      amount: formatMKD(expectedAmount),
      price: formatMKD(selectedMember.tierPrice),
      months: numberOfMonths,
    })}
  </p>
)}
```

Add `formatMKD` to the imports from `@/lib/utils`.

**Step 5: Update the "Month For" label to "Starting Month" when months > 1**

Replace the month DatePicker:

```tsx
<DatePicker
  label={t("monthFor")}
  value={monthFor}
  onChange={setMonthFor}
  mode="month"
  required
/>
```

With:

```tsx
<DatePicker
  label={numberOfMonths > 1 ? t("startingMonth") : t("monthFor")}
  value={monthFor}
  onChange={setMonthFor}
  mode="month"
  required
/>
```

**Step 6: Add numberOfMonths to form submission**

In the `handleSubmit` function, add after `formData.set("notes", notes)`:

```tsx
formData.set("numberOfMonths", String(numberOfMonths));
```

**Step 7: Verify visually**

Open `http://localhost:3333/dashboard/payments`, click "Log Payment":
- Select a member → amount should NOT auto-fill yet (months is 1)
- Change months to 3 → amount should auto-fill to `tierPrice * 3`
- Label should change from "Month For" to "Starting Month"
- Expected hint should appear below amount

**Step 8: Commit**

```bash
git add src/components/payments/payment-form.tsx
git commit -m "feat: add advance payment UI with auto-calculation and month selector"
```

---

## Task 8: Final verification and combined commit

**Step 1: Run build**

```bash
npm run build
```

Should compile without errors.

**Step 2: Run lint**

```bash
npm run lint
```

Should pass with no errors.

**Step 3: Visual verification**

- Navigate to `/dashboard/attendance` — verify date picker layout
- Navigate to `/dashboard/payments` — verify advance payment form
- Test single-month payment (should work as before)
- Test multi-month payment with 3 months
- Check payment history shows 3 separate records with "Advance payment 1/3" etc.
