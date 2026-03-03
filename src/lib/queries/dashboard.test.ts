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

const { getDashboardStats, getFlaggedMembers, getRecentPayments, getRecentClassSessionsBySport } =
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

  describe("getRecentClassSessionsBySport", () => {
    it("returns sessions for a specific sport", async () => {
      const sessions = await getRecentClassSessionsBySport("sport_bjj");
      // session_1 is the only BJJ session in seed data
      expect(sessions).toHaveLength(1);
      expect(sessions[0].date).toBe("2026-02-23");
      expect(sessions[0].startTime).toBe("18:00");
      expect(sessions[0].endTime).toBe("19:30");
    });

    it("returns correct attendee count", async () => {
      const sessions = await getRecentClassSessionsBySport("sport_bjj");
      // 2 present attendees in session_1
      expect(sessions[0].attendeeCount).toBe(2);
    });

    it("returns empty array for sport with no sessions", async () => {
      const sessions = await getRecentClassSessionsBySport("sport_mma");
      expect(sessions).toHaveLength(0);
    });

    it("respects the limit parameter", async () => {
      // Add extra BJJ sessions
      const { classSessions } = await import("@/db/schema");
      for (let i = 0; i < 5; i++) {
        await testDb.insert(classSessions).values({
          id: `session_limit_${i}`,
          scheduleId: "sched_1",
          date: `2026-02-1${i}`,
        });
      }

      const limited = await getRecentClassSessionsBySport("sport_bjj", 3);
      expect(limited).toHaveLength(3);

      const all = await getRecentClassSessionsBySport("sport_bjj");
      expect(all.length).toBe(6); // 1 original + 5 new
    });

    it("orders sessions by date descending", async () => {
      const { classSessions } = await import("@/db/schema");
      await testDb.insert(classSessions).values({
        id: "session_older",
        scheduleId: "sched_1",
        date: "2026-02-10",
      });

      const sessions = await getRecentClassSessionsBySport("sport_bjj");
      expect(sessions).toHaveLength(2);
      // Most recent first
      expect(sessions[0].date).toBe("2026-02-23");
      expect(sessions[1].date).toBe("2026-02-10");
    });

    it("counts only present attendees, not absent ones", async () => {
      const { classSessions, attendance } = await import("@/db/schema");

      // Create a new session with mixed attendance
      await testDb.insert(classSessions).values({
        id: "session_mixed",
        scheduleId: "sched_1",
        date: "2026-02-20",
      });
      await testDb.insert(attendance).values([
        { id: "att_mix_1", memberId: "member_1", classSessionId: "session_mixed", present: true },
        { id: "att_mix_2", memberId: "member_2", classSessionId: "session_mixed", present: false },
      ]);

      const sessions = await getRecentClassSessionsBySport("sport_bjj");
      const mixedSession = sessions.find((s) => s.sessionId === "session_mixed");
      expect(mixedSession).toBeDefined();
      expect(mixedSession!.attendeeCount).toBe(1); // Only 1 present
    });

    it("returns zero attendees for sessions with no attendance records", async () => {
      const sessions = await getRecentClassSessionsBySport("sport_kb");
      // No KB sessions in seed data, but let's add one without attendance
      const { classSessions } = await import("@/db/schema");
      await testDb.insert(classSessions).values({
        id: "session_kb_empty",
        scheduleId: "sched_2",
        date: "2026-02-24",
      });

      const kbSessions = await getRecentClassSessionsBySport("sport_kb");
      expect(kbSessions).toHaveLength(1);
      expect(kbSessions[0].attendeeCount).toBe(0);
    });
  });

});
