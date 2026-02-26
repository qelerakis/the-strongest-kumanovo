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
