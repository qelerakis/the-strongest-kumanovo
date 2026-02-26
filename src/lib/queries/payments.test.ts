import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import type { Client } from "@libsql/client";

let testDb: TestDb;
let testClient: Client;

vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

const { getPaymentsForMember, getPaymentsSummary } = await import(
  "./payments"
);

describe("payments queries", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    testClient = setup.client;
    await seedTestData(testDb);
  });

  describe("getPaymentsForMember", () => {
    it("returns payments ordered by date descending", async () => {
      const payments = await getPaymentsForMember("member_1");
      expect(payments).toHaveLength(2);
      // 2026-02-01 should come before 2026-01-05 in desc order
      expect(payments[0].paymentDate).toBe("2026-02-01");
      expect(payments[1].paymentDate).toBe("2026-01-05");
    });

    it("returns correct payment data", async () => {
      const payments = await getPaymentsForMember("member_1");
      const febPayment = payments[0];
      expect(febPayment.amountMkd).toBe(1500);
      expect(febPayment.monthFor).toBe("2026-02");
      expect(febPayment.notes).toBe("February payment");
    });

    it("returns empty array for member with no payments", async () => {
      const payments = await getPaymentsForMember("member_3");
      expect(payments).toHaveLength(0);
    });

    it("returns only payments for the specific member", async () => {
      const payments = await getPaymentsForMember("member_2");
      expect(payments).toHaveLength(1);
      expect(payments[0].memberId).toBe("member_2");
      expect(payments[0].amountMkd).toBe(2500);
    });
  });

  describe("getPaymentsSummary", () => {
    it("computes per-member totals for a given month", async () => {
      const summary = await getPaymentsSummary("2026-02");

      // Only active members are included (member_1 and member_2)
      expect(summary).toHaveLength(2);

      // Sorted by fullName
      expect(summary[0].fullName).toBe("Ana Kostadinova");
      expect(summary[1].fullName).toBe("Stefan Petrovic");
    });

    it("computes correct balance per member", async () => {
      const summary = await getPaymentsSummary("2026-02");

      const stefan = summary.find((m) => m.fullName === "Stefan Petrovic");
      expect(stefan!.totalPaid).toBe(1500);
      expect(stefan!.tierPrice).toBe(1500);
      expect(stefan!.balance).toBe(0); // 1500 - 1500

      const ana = summary.find((m) => m.fullName === "Ana Kostadinova");
      expect(ana!.totalPaid).toBe(2500);
      expect(ana!.tierPrice).toBe(2500);
      expect(ana!.balance).toBe(0); // 2500 - 2500
    });

    it("shows zero totalPaid for month with no payments", async () => {
      const summary = await getPaymentsSummary("2025-12");

      // Active members still show up but with 0 paid
      expect(summary).toHaveLength(2);
      for (const member of summary) {
        expect(member.totalPaid).toBe(0);
        expect(member.balance).toBe(-member.tierPrice);
      }
    });

    it("excludes inactive members from summary", async () => {
      const summary = await getPaymentsSummary("2026-02");
      const marko = summary.find((m) => m.fullName === "Marko Nikolovski");
      expect(marko).toBeUndefined();
    });
  });
});
