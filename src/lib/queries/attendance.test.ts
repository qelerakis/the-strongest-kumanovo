import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";

let testDb: TestDb;

vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

const {
  getClassSessionsForDate,
  getAttendanceForSession,
  getMonthlyAttendanceCount,
} = await import("./attendance");

describe("attendance queries", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
  });

  describe("getClassSessionsForDate", () => {
    it("returns existing sessions for a date that already has them", async () => {
      // 2026-02-23 (Monday) already has a session from seed data
      const sessions = await getClassSessionsForDate("2026-02-23");
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sportName).toBe("BJJ");
      expect(sessions[0].startTime).toBe("18:00");
      expect(sessions[0].date).toBe("2026-02-23");
    });

    it("auto-creates sessions from schedule for a new date", async () => {
      // 2026-02-24 is a Tuesday - has kickboxing scheduled (sched_2)
      const sessions = await getClassSessionsForDate("2026-02-24");
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sportName).toBe("Kickboxing");
      expect(sessions[0].startTime).toBe("19:00");
      expect(sessions[0].date).toBe("2026-02-24");
    });

    it("returns empty for a day with no scheduled classes", async () => {
      // 2026-02-22 is a Sunday (dayOfWeek=0) - no classes scheduled
      const sessions = await getClassSessionsForDate("2026-02-22");
      expect(sessions).toHaveLength(0);
    });

    it("does not duplicate sessions on repeated calls", async () => {
      // Call twice for the same date
      await getClassSessionsForDate("2026-02-24");
      const sessions = await getClassSessionsForDate("2026-02-24");
      expect(sessions).toHaveLength(1);
    });
  });

  describe("getAttendanceForSession", () => {
    it("returns attendance records with member names", async () => {
      const records = await getAttendanceForSession("session_1");
      expect(records).toHaveLength(2);

      // Ordered by member fullName
      expect(records[0].memberName).toBe("Ana Kostadinova");
      expect(records[0].present).toBe(true);
      expect(records[1].memberName).toBe("Stefan Petrovic");
      expect(records[1].present).toBe(true);
    });

    it("returns empty array for session with no attendance", async () => {
      // Create a new session with no attendance
      const { classSessions } = await import("@/db/schema");
      await testDb.insert(classSessions).values({
        id: "session_empty",
        scheduleId: "sched_2",
        date: "2026-02-25",
      });

      const records = await getAttendanceForSession("session_empty");
      expect(records).toHaveLength(0);
    });
  });

  describe("getMonthlyAttendanceCount", () => {
    it("counts attendance correctly for a member in a month", async () => {
      // member_1 has 1 present attendance in 2026-02 (session_1 on 2026-02-23)
      const count = await getMonthlyAttendanceCount("member_1", "2026-02");
      expect(count).toBe(1);
    });

    it("returns 0 for member with no attendance in that month", async () => {
      const count = await getMonthlyAttendanceCount("member_3", "2026-02");
      expect(count).toBe(0);
    });

    it("returns 0 for a month with no sessions", async () => {
      const count = await getMonthlyAttendanceCount("member_1", "2025-09");
      expect(count).toBe(0);
    });

    it("counts multiple attendances in the same month", async () => {
      // Add another session and attendance for member_1 in Feb
      const { classSessions, attendance } = await import("@/db/schema");
      await testDb.insert(classSessions).values({
        id: "session_extra",
        scheduleId: "sched_3",
        date: "2026-02-25",
      });
      await testDb.insert(attendance).values({
        id: "att_extra",
        memberId: "member_1",
        classSessionId: "session_extra",
        present: true,
      });

      const count = await getMonthlyAttendanceCount("member_1", "2026-02");
      expect(count).toBe(2);
    });
  });
});
