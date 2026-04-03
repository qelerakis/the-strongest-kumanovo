import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import { eq, and } from "drizzle-orm";
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

const {
  openClassSession,
  markAttendance,
  getSessionsForDateAction,
  getSessionDetailsAction,
} = await import("./attendance");

describe("attendance actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);

    // Reset mock to default admin session
    mockAuth.mockResolvedValue({
      user: { id: "admin_user", username: "admin", role: "admin", memberId: null },
    });
  });

  describe("auth guards", () => {
    // --- openClassSession ---

    it("openClassSession rejects unauthenticated (null session)", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await openClassSession("sched_1", "2026-03-02");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("openClassSession rejects member role", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_member1", username: "stefan", role: "member", memberId: "member_1" },
      });
      const result = await openClassSession("sched_1", "2026-03-02");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    // --- markAttendance ---

    it("markAttendance rejects unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await markAttendance("session_1", ["member_1"], ["member_1", "member_2"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("markAttendance rejects member role", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_member1", username: "stefan", role: "member", memberId: "member_1" },
      });
      const result = await markAttendance("session_1", ["member_1"], ["member_1", "member_2"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    // --- getSessionsForDateAction ---

    it("getSessionsForDateAction rejects unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await getSessionsForDateAction("2026-02-23");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("getSessionsForDateAction allows member role", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_member1", username: "stefan", role: "member", memberId: "member_1" },
      });
      const result = await getSessionsForDateAction("2026-02-23");
      expect(result.success).toBe(true);
    });

    // --- getSessionDetailsAction ---

    it("getSessionDetailsAction rejects unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await getSessionDetailsAction("session_1", "sport_bjj");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("getSessionDetailsAction allows member role", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user_member1", username: "stefan", role: "member", memberId: "member_1" },
      });
      const result = await getSessionDetailsAction("session_1", "sport_bjj");
      expect(result.success).toBe(true);
    });
  });

  describe("openClassSession", () => {
    it("creates new session for valid schedule + date", async () => {
      const result = await openClassSession("sched_1", "2026-03-02");
      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();

      // Verify session exists in database
      const sessions = await testDb
        .select()
        .from(schema.classSessions)
        .where(
          and(
            eq(schema.classSessions.scheduleId, "sched_1"),
            eq(schema.classSessions.date, "2026-03-02")
          )
        );
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(result.sessionId);
    });

    it("returns existing session if already exists (idempotent)", async () => {
      // session_1 already exists for sched_1 on 2026-02-23
      const result = await openClassSession("sched_1", "2026-02-23");
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe("session_1");

      // Verify no duplicate was created
      const sessions = await testDb
        .select()
        .from(schema.classSessions)
        .where(
          and(
            eq(schema.classSessions.scheduleId, "sched_1"),
            eq(schema.classSessions.date, "2026-02-23")
          )
        );
      expect(sessions).toHaveLength(1);
    });

    it("returns sessionId on success", async () => {
      const result = await openClassSession("sched_2", "2026-03-03");
      expect(result.success).toBe(true);
      expect(typeof result.sessionId).toBe("string");
      expect(result.sessionId!.length).toBeGreaterThan(0);
    });
  });

  describe("markAttendance", () => {
    it("marks present members correctly", async () => {
      // Create a fresh session for this test
      const sessionResult = await openClassSession("sched_2", "2026-03-03");
      const sessionId = sessionResult.sessionId!;

      const result = await markAttendance(
        sessionId,
        ["member_1"],
        ["member_1", "member_2"]
      );
      expect(result.success).toBe(true);

      // member_1 should be present
      const att1 = await testDb
        .select()
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.classSessionId, sessionId),
            eq(schema.attendance.memberId, "member_1")
          )
        );
      expect(att1).toHaveLength(1);
      expect(att1[0].present).toBe(true);

      // member_2 should be not present
      const att2 = await testDb
        .select()
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.classSessionId, sessionId),
            eq(schema.attendance.memberId, "member_2")
          )
        );
      expect(att2).toHaveLength(1);
      expect(att2[0].present).toBe(false);
    });

    it("handles upsert (updates existing attendance records)", async () => {
      // session_1 already has att_1 (member_1 present) and att_2 (member_2 present)
      // Now mark only member_2 as present, member_1 as absent
      const result = await markAttendance(
        "session_1",
        ["member_2"],
        ["member_1", "member_2"]
      );
      expect(result.success).toBe(true);

      // member_1 should now be NOT present (updated from true to false)
      const att1 = await testDb
        .select()
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.classSessionId, "session_1"),
            eq(schema.attendance.memberId, "member_1")
          )
        );
      expect(att1).toHaveLength(1);
      expect(att1[0].present).toBe(false);

      // member_2 should still be present
      const att2 = await testDb
        .select()
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.classSessionId, "session_1"),
            eq(schema.attendance.memberId, "member_2")
          )
        );
      expect(att2).toHaveLength(1);
      expect(att2[0].present).toBe(true);
    });

    it("creates records for all members in allMemberIds", async () => {
      const sessionResult = await openClassSession("sched_3", "2026-03-04");
      const sessionId = sessionResult.sessionId!;

      const result = await markAttendance(
        sessionId,
        ["member_1", "member_2"],
        ["member_1", "member_2", "member_3"]
      );
      expect(result.success).toBe(true);

      // All 3 members should have attendance records
      const records = await testDb
        .select()
        .from(schema.attendance)
        .where(eq(schema.attendance.classSessionId, sessionId));
      expect(records).toHaveLength(3);

      const byMember = new Map(records.map((r) => [r.memberId, r.present]));
      expect(byMember.get("member_1")).toBe(true);
      expect(byMember.get("member_2")).toBe(true);
      expect(byMember.get("member_3")).toBe(false);
    });
  });

  describe("getSessionsForDateAction", () => {
    it("returns sessions for a date that has classes", async () => {
      // session_1 exists for 2026-02-23 (sched_1 = BJJ Monday)
      const result = await getSessionsForDateAction("2026-02-23");
      expect(result.success).toBe(true);
      expect(result.sessions.length).toBeGreaterThanOrEqual(1);

      // Should include the existing session for sched_1
      const bjjSession = result.sessions.find((s) => s.scheduleId === "sched_1");
      expect(bjjSession).toBeDefined();
      expect(bjjSession!.sportName).toBe("BJJ");
    });

    it("returns empty array for date with no classes", async () => {
      // 2026-02-22 is a Sunday, and there are no Sunday schedule slots in seed data
      const result = await getSessionsForDateAction("2026-02-22");
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(0);
    });
  });

  describe("getSessionDetailsAction", () => {
    it("returns members enrolled in the sport", async () => {
      const result = await getSessionDetailsAction("session_1", "sport_bjj");
      expect(result.success).toBe(true);

      // member_1 (Stefan, active, enrolled in BJJ) and member_2 (Ana, active, enrolled in BJJ)
      expect(result.members.length).toBe(2);

      const names = result.members.map((m) => m.fullName).sort();
      expect(names).toEqual(["Ana Kostadinova", "Stefan Petrovic"]);
    });

    it("returns existing attendance records", async () => {
      const result = await getSessionDetailsAction("session_1", "sport_bjj");
      expect(result.success).toBe(true);

      // session_1 has att_1 (member_1 present) and att_2 (member_2 present)
      expect(result.existingAttendance.length).toBe(2);

      const attendanceByMember = new Map(
        result.existingAttendance.map((a) => [a.memberId, a.present])
      );
      expect(attendanceByMember.get("member_1")).toBe(true);
      expect(attendanceByMember.get("member_2")).toBe(true);
    });
  });
});
