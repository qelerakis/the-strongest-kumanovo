import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";

let testDb: TestDb;

vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    getCurrentMonth: () => "2026-02",
  };
});

const { getDashboardStats, getFlaggedMembers, getRecentPayments } =
  await import("./dashboard");

describe("dashboard queries", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
  });

  describe("getDashboardStats", () => {
    it("returns correct total member count", async () => {
      const stats = await getDashboardStats();
      expect(stats.totalMembers).toBe(3);
    });

    it("returns correct active member count", async () => {
      const stats = await getDashboardStats();
      expect(stats.activeMembers).toBe(2);
    });

    it("returns monthly revenue for current month", async () => {
      // Payments for 2026-02: 1500 (member_1) + 2500 (member_2) = 4000
      const stats = await getDashboardStats();
      expect(stats.monthlyRevenue).toBe(4000);
    });

    it("computes attendance rate", async () => {
      // 2 active members, 2 attended in Feb (member_1 and member_2)
      // Rate = (2 / 2) * 100 = 100%
      const stats = await getDashboardStats();
      expect(stats.monthlyAttendanceRate).toBe(100);
    });
  });

  describe("getFlaggedMembers", () => {
    it("returns members with fewer than 3 attendances", async () => {
      // Both active members have 1 attendance each in Feb => both flagged
      const flagged = await getFlaggedMembers("2026-02");
      expect(flagged).toHaveLength(2);

      // All should have less than 3 attendances
      for (const member of flagged) {
        expect(member.attendanceCount).toBeLessThan(3);
      }
    });

    it("does not include inactive members", async () => {
      const flagged = await getFlaggedMembers("2026-02");
      const marko = flagged.find((m) => m.fullName === "Marko Nikolovski");
      expect(marko).toBeUndefined();
    });

    it("excludes members with 3+ attendances", async () => {
      // Add 3 more sessions and attendances for member_1
      const { classSessions, attendance } = await import("@/db/schema");

      for (let i = 0; i < 3; i++) {
        const sessionId = `session_flag_${i}`;
        await testDb.insert(classSessions).values({
          id: sessionId,
          scheduleId: "sched_1",
          date: `2026-02-0${i + 1}`,
        });
        await testDb.insert(attendance).values({
          id: `att_flag_${i}`,
          memberId: "member_1",
          classSessionId: sessionId,
          present: true,
        });
      }

      // member_1 now has 4 attendances (1 original + 3 new) => not flagged
      const flagged = await getFlaggedMembers("2026-02");
      const stefan = flagged.find((m) => m.fullName === "Stefan Petrovic");
      expect(stefan).toBeUndefined();

      // member_2 still has 1 attendance => still flagged
      const ana = flagged.find((m) => m.fullName === "Ana Kostadinova");
      expect(ana).toBeDefined();
      expect(ana!.attendanceCount).toBe(1);
    });

    it("shows zero attendance count for members with no sessions", async () => {
      const flagged = await getFlaggedMembers("2025-09");
      // All active members have 0 in Sept
      expect(flagged).toHaveLength(2);
      for (const m of flagged) {
        expect(m.attendanceCount).toBe(0);
      }
    });
  });

  describe("getRecentPayments", () => {
    it("returns payments with member names", async () => {
      const payments = await getRecentPayments();
      expect(payments.length).toBeGreaterThan(0);
      for (const p of payments) {
        expect(p.memberName).toBeDefined();
        expect(p.amountMkd).toBeGreaterThan(0);
      }
    });

    it("respects the limit parameter", async () => {
      const payments = await getRecentPayments(2);
      expect(payments.length).toBeLessThanOrEqual(2);
    });

    it("returns default 5 or fewer", async () => {
      const payments = await getRecentPayments();
      expect(payments.length).toBeLessThanOrEqual(5);
      // We have 3 payments in seed data
      expect(payments).toHaveLength(3);
    });
  });
});
