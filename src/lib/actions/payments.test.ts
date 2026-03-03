import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";

let testDb: TestDb;

vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = vi.fn().mockResolvedValue({
  user: { id: "admin_user", username: "admin", role: "admin", memberId: null },
});

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const { logPayment, deletePayment } = await import("./payments");

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

describe("payments actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;

    // @libsql/client :memory: databases open a separate connection for
    // transactions, which creates a blank database (no tables). Override
    // transaction to run the callback directly on the main connection so
    // multi-month insert logic is testable. Atomicity is a DB-level concern.
    const origTransaction = testDb.transaction;
    (testDb as any).transaction = async (callback: (tx: typeof testDb) => Promise<void>) => {
      return callback(testDb);
    };

    await seedTestData(testDb);
  });

  describe("logPayment", () => {
    it("creates payment with valid data", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "1500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        notes: "March payment",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(true);

      // Verify in database
      const payments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.monthFor, "2026-03"));
      expect(payments).toHaveLength(1);
      expect(payments[0].amountMkd).toBe(1500);
      expect(payments[0].notes).toBe("March payment");
    });

    it("creates payment without notes", async () => {
      const fd = makeFormData({
        memberId: "member_2",
        amountMkd: "2500",
        paymentDate: "2026-03-15",
        monthFor: "2026-03",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(true);
    });

    it("returns error for invalid amount (zero)", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "0",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("returns error for negative amount", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "-100",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(false);
    });

    it("returns error for missing memberId", async () => {
      const fd = makeFormData({
        memberId: "",
        amountMkd: "1500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(false);
    });

    it("returns error for invalid monthFor format", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "1500",
        paymentDate: "2026-03-01",
        monthFor: "2026-3",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(false);
    });
  });

  describe("deletePayment", () => {
    it("removes payment from database", async () => {
      const result = await deletePayment("pay_1");
      expect(result.success).toBe(true);

      const payments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.id, "pay_1"));
      expect(payments).toHaveLength(0);
    });

    it("does not affect other payments", async () => {
      await deletePayment("pay_1");

      const remaining = await testDb.select().from(schema.payments);
      expect(remaining).toHaveLength(2); // pay_2 and pay_3 remain
    });
  });

  describe("logPayment — multi-month advance", () => {
    it("creates 3 payment records for numberOfMonths=3", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "4500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(true);

      // member_1 is tier_basic (1500 MKD), so 3 months @ 1500 = 4500 total
      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));
      expect(newPayments).toHaveLength(3);
    });

    it("assigns correct incrementing monthFor values", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "4500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
      });

      await logPayment(fd);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      const months = newPayments.map((p) => p.monthFor).sort();
      expect(months).toEqual(["2026-03", "2026-04", "2026-05"]);
    });

    it("splits amount: tier price for first N-1, remainder for last", async () => {
      // member_1 = tier_basic = 1500 MKD/month
      // 3 months, total 4500 => 1500 + 1500 + 1500
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "4500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
      });

      await logPayment(fd);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      // Sort by monthFor to get consistent order
      newPayments.sort((a, b) => a.monthFor.localeCompare(b.monthFor));

      expect(newPayments[0].amountMkd).toBe(1500); // March
      expect(newPayments[1].amountMkd).toBe(1500); // April
      expect(newPayments[2].amountMkd).toBe(1500); // May (remainder = 4500 - 1500*2 = 1500)
    });

    it("puts remainder on last month when admin overpays", async () => {
      // member_1 = tier_basic = 1500 MKD/month
      // 3 months, total 5000 => 1500 + 1500 + 2000
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "5000",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
      });

      await logPayment(fd);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      newPayments.sort((a, b) => a.monthFor.localeCompare(b.monthFor));

      expect(newPayments[0].amountMkd).toBe(1500); // tier price
      expect(newPayments[1].amountMkd).toBe(1500); // tier price
      expect(newPayments[2].amountMkd).toBe(2000); // remainder: 5000 - 1500*2
    });

    it("auto-generates advance payment notes without custom notes", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "4500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
      });

      await logPayment(fd);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      newPayments.sort((a, b) => a.monthFor.localeCompare(b.monthFor));

      expect(newPayments[0].notes).toBe("Advance payment 1/3");
      expect(newPayments[1].notes).toBe("Advance payment 2/3");
      expect(newPayments[2].notes).toBe("Advance payment 3/3");
    });

    it("appends custom notes to advance payment label", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "4500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
        notes: "Paid cash",
      });

      await logPayment(fd);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      newPayments.sort((a, b) => a.monthFor.localeCompare(b.monthFor));

      expect(newPayments[0].notes).toBe("Advance payment 1/3 — Paid cash");
      expect(newPayments[1].notes).toBe("Advance payment 2/3 — Paid cash");
      expect(newPayments[2].notes).toBe("Advance payment 3/3 — Paid cash");
    });

    it("rejects when total amount is too low to split", async () => {
      // member_1 = tier_basic = 1500 MKD/month
      // 3 months at 1500/mo = 4500 needed minimum
      // Paying only 2500 => lastMonthAmount = 2500 - 1500*2 = -500 <= 0
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "2500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(false);
      expect(result.error).toContain("too low to split");

      // No payments should have been created (guard before transaction)
      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));
      expect(newPayments).toHaveLength(0);
    });

    it("rejects when total equals tier price * (N-1) exactly (last month = 0)", async () => {
      // member_1 = 1500 MKD/month, 3 months, total = 3000
      // lastMonthAmount = 3000 - 1500*2 = 0 => rejected
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "3000",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "3",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(false);
      expect(result.error).toContain("too low to split");
    });

    it("handles year boundary in multi-month (Nov → Jan)", async () => {
      // member_2 = tier_standard = 2500 MKD/month
      const fd = makeFormData({
        memberId: "member_2",
        amountMkd: "7500",
        paymentDate: "2026-11-01",
        monthFor: "2026-11",
        numberOfMonths: "3",
      });

      await logPayment(fd);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-11-01"));

      const months = newPayments.map((p) => p.monthFor).sort();
      expect(months).toEqual(["2026-11", "2026-12", "2027-01"]);
    });

    it("works with standard tier pricing", async () => {
      // member_2 = tier_standard = 2500 MKD/month
      // 2 months, total 5000 => 2500 + 2500
      const fd = makeFormData({
        memberId: "member_2",
        amountMkd: "5000",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "2",
      });

      await logPayment(fd);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      newPayments.sort((a, b) => a.monthFor.localeCompare(b.monthFor));
      expect(newPayments).toHaveLength(2);
      expect(newPayments[0].amountMkd).toBe(2500);
      expect(newPayments[1].amountMkd).toBe(2500);
    });

    it("uses single-month path when numberOfMonths is 1", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "1500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
        numberOfMonths: "1",
        notes: "Single month explicit",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(true);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      expect(newPayments).toHaveLength(1);
      // Single-month path stores notes directly, no advance label
      expect(newPayments[0].notes).toBe("Single month explicit");
    });

    it("defaults to single-month when numberOfMonths is omitted", async () => {
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "1500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
      });

      const result = await logPayment(fd);
      expect(result.success).toBe(true);

      const newPayments = await testDb
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.paymentDate, "2026-03-01"));

      expect(newPayments).toHaveLength(1);
      expect(newPayments[0].notes).toBeNull();
    });
  });

  describe("auth guards", () => {
    it("rejects unauthenticated logPayment", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const fd = makeFormData({
        memberId: "member_1",
        amountMkd: "1500",
        paymentDate: "2026-03-01",
        monthFor: "2026-03",
      });
      const result = await logPayment(fd);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member-role deletePayment", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });
      const result = await deletePayment("pay_1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });
});
