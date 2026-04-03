import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import * as schema from "@/db/schema";

let testDb: TestDb;

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
    it("returns only active members", async () => {
      const summary = await getPaymentsSummary("2026-02");
      // Only active members are included (member_1 and member_2)
      expect(summary).toHaveLength(2);
      const marko = summary.find((m) => m.fullName === "Marko Nikolovski");
      expect(marko).toBeUndefined();
    });

    it("sorts members by fullName", async () => {
      const summary = await getPaymentsSummary("2026-02");
      expect(summary[0].fullName).toBe("Ana Kostadinova");
      expect(summary[1].fullName).toBe("Stefan Petrovic");
    });

    it("returns totalPaid for the selected month only", async () => {
      const summary = await getPaymentsSummary("2026-02");
      const stefan = summary.find((m) => m.fullName === "Stefan Petrovic");
      // Stefan paid 1500 for 2026-02 (pay_1)
      expect(stefan!.totalPaid).toBe(1500);
    });

    it("returns 0 totalPaid for month with no payments", async () => {
      const summary = await getPaymentsSummary("2026-03");
      for (const member of summary) {
        expect(member.totalPaid).toBe(0);
      }
    });

    // =========================================================
    // CUMULATIVE BALANCE TESTS (new behavior)
    // =========================================================
    // Seed data:
    //   member_1 (Stefan): joinDate 2025-10-01, Basic tier 1500 MKD/mo
    //     pay_1: 1500 for 2026-02
    //     pay_2: 1500 for 2026-01
    //   member_2 (Ana): joinDate 2025-11-01, Standard tier 2500 MKD/mo
    //     pay_3: 2500 for 2026-02

    describe("cumulative balance", () => {
      it("computes cumulative balance for Stefan in 2026-02", async () => {
        // Stefan joined 2025-10, viewing Feb 2026
        // Months owed: Oct, Nov, Dec, Jan, Feb = 5 months * 1500 = 7500
        // Cumulative paid (monthFor <= 2026-02): pay_1 (1500) + pay_2 (1500) = 3000
        // Balance = 3000 - 7500 = -4500 (debt)
        const summary = await getPaymentsSummary("2026-02");
        const stefan = summary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefan!.balance).toBe(3000 - 7500); // -4500
      });

      it("computes cumulative balance for Ana in 2026-02", async () => {
        // Ana joined 2025-11, viewing Feb 2026
        // Months owed: Nov, Dec, Jan, Feb = 4 months * 2500 = 10000
        // Cumulative paid (monthFor <= 2026-02): pay_3 (2500) = 2500
        // Balance = 2500 - 10000 = -7500 (debt)
        const summary = await getPaymentsSummary("2026-02");
        const ana = summary.find((m) => m.fullName === "Ana Kostadinova");
        expect(ana!.balance).toBe(2500 - 10000); // -7500
      });

      it("shows same debt if viewing earlier month (Jan)", async () => {
        // Viewing Jan 2026:
        // Stefan: months owed Oct-Jan = 4 * 1500 = 6000
        //   cumulative paid (monthFor <= 2026-01): pay_2 (1500) = 1500
        //   balance = 1500 - 6000 = -4500
        const summary = await getPaymentsSummary("2026-01");
        const stefan = summary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefan!.totalPaid).toBe(1500); // Only Jan payment
        expect(stefan!.balance).toBe(1500 - 6000); // -4500
      });

      it("shows zero totalPaid for future month", async () => {
        const summary = await getPaymentsSummary("2026-05");
        for (const member of summary) {
          expect(member.totalPaid).toBe(0);
        }
      });

      it("carries overpay credit forward to next month", async () => {
        // Add an overpayment for Stefan in March
        await testDb.insert(schema.payments).values({
          id: "pay_overpay",
          memberId: "member_1",
          amountMkd: 10000, // Big overpayment
          paymentDate: "2026-03-01",
          monthFor: "2026-03",
        });

        // Viewing March 2026:
        // Stefan: months owed Oct-Mar = 6 * 1500 = 9000
        // Cumulative paid: 1500 (Jan) + 1500 (Feb) + 10000 (Mar) = 13000
        // Balance = 13000 - 9000 = 4000 (CREDIT)
        const marchSummary = await getPaymentsSummary("2026-03");
        const stefanMar = marchSummary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefanMar!.totalPaid).toBe(10000); // This month only
        expect(stefanMar!.balance).toBe(13000 - 9000); // +4000 credit

        // Viewing April 2026:
        // Stefan: months owed Oct-Apr = 7 * 1500 = 10500
        // Cumulative paid still 13000 (no April payment)
        // Balance = 13000 - 10500 = 2500 (credit carried forward!)
        const aprilSummary = await getPaymentsSummary("2026-04");
        const stefanApr = aprilSummary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefanApr!.totalPaid).toBe(0); // No payment this month
        expect(stefanApr!.balance).toBe(13000 - 10500); // +2500 credit carried

        // Viewing May 2026:
        // Stefan: months owed Oct-May = 8 * 1500 = 12000
        // Balance = 13000 - 12000 = 1000 (credit still carrying)
        const maySummary = await getPaymentsSummary("2026-05");
        const stefanMay = maySummary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefanMay!.balance).toBe(13000 - 12000); // +1000

        // Viewing June 2026:
        // Stefan: months owed Oct-Jun = 9 * 1500 = 13500
        // Balance = 13000 - 13500 = -500 (credit exhausted, back to debt)
        const juneSummary = await getPaymentsSummary("2026-06");
        const stefanJun = juneSummary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefanJun!.balance).toBe(13000 - 13500); // -500 debt
      });

      it("handles member who joined in the selected month", async () => {
        // Viewing Oct 2025 (Stefan's join month):
        // Months owed: just Oct = 1 * 1500 = 1500
        // Cumulative paid (monthFor <= 2025-10): 0 (no payments for Oct)
        // Balance = 0 - 1500 = -1500
        const summary = await getPaymentsSummary("2025-10");
        const stefan = summary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefan!.balance).toBe(-1500);
      });

      it("handles viewing month before member joined (no debt)", async () => {
        // Ana joined 2025-11, viewing Oct 2025
        // getMonthsBetween("2025-11-01", "2025-10-01") returns []
        // Months owed = 0 * 2500 = 0
        // Cumulative paid = 0
        // Balance = 0
        const summary = await getPaymentsSummary("2025-10");
        const ana = summary.find((m) => m.fullName === "Ana Kostadinova");
        // Before join month, no months owed
        expect(ana!.balance).toBe(0);
      });

      it("includes tier information in summary", async () => {
        const summary = await getPaymentsSummary("2026-02");
        const stefan = summary.find((m) => m.fullName === "Stefan Petrovic");
        expect(stefan!.tierName).toBe("Basic");
        expect(stefan!.tierPrice).toBe(1500);

        const ana = summary.find((m) => m.fullName === "Ana Kostadinova");
        expect(ana!.tierName).toBe("Standard");
        expect(ana!.tierPrice).toBe(2500);
      });
    });
  });
});
