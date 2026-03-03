import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { revalidatePath } from "next/cache";

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

const { addClassSlot, updateClassSlot, removeClassSlot } = await import(
  "./schedule"
);

const mockRevalidatePath = vi.mocked(revalidatePath);

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

const EXPECTED_REVALIDATION_PATHS = ["/dashboard/schedule", "/", "/member"];

describe("schedule actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
    mockRevalidatePath.mockClear();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "admin_user", username: "admin", role: "admin", memberId: null },
    });
  });

  describe("addClassSlot", () => {
    it("creates a new schedule slot with valid data", async () => {
      const fd = makeFormData({
        sportId: "sport_mma",
        dayOfWeek: "4", // Thursday
        startTime: "17:00",
        endTime: "18:30",
      });

      const result = await addClassSlot(fd);
      expect(result.success).toBe(true);

      // Verify in database
      const slots = await testDb
        .select()
        .from(schema.schedule)
        .where(eq(schema.schedule.sportId, "sport_mma"));
      expect(slots.length).toBeGreaterThanOrEqual(1);

      const newSlot = slots.find((s) => s.dayOfWeek === 4);
      expect(newSlot).toBeDefined();
      expect(newSlot!.startTime).toBe("17:00");
      expect(newSlot!.endTime).toBe("18:30");
      expect(newSlot!.isActive).toBe(true);
    });

    it("creates a slot without endTime", async () => {
      const fd = makeFormData({
        sportId: "sport_mma",
        dayOfWeek: "5", // Friday
        startTime: "16:00",
        endTime: "",
      });

      const result = await addClassSlot(fd);
      expect(result.success).toBe(true);

      const slots = await testDb
        .select()
        .from(schema.schedule)
        .where(eq(schema.schedule.sportId, "sport_mma"));
      expect(slots).toHaveLength(1);
      expect(slots[0].endTime).toBeNull();
    });

    it("rejects invalid data (missing sportId)", async () => {
      const fd = makeFormData({
        sportId: "",
        dayOfWeek: "1",
        startTime: "18:00",
      });

      const result = await addClassSlot(fd);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects invalid dayOfWeek (out of range)", async () => {
      const fd = makeFormData({
        sportId: "sport_bjj",
        dayOfWeek: "7",
        startTime: "18:00",
      });

      const result = await addClassSlot(fd);
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format", async () => {
      const fd = makeFormData({
        sportId: "sport_bjj",
        dayOfWeek: "1",
        startTime: "6pm",
      });

      const result = await addClassSlot(fd);
      expect(result.success).toBe(false);
    });
  });

  describe("updateClassSlot", () => {
    it("modifies an existing slot", async () => {
      const fd = makeFormData({
        sportId: "sport_kb",
        dayOfWeek: "1", // Change from Monday BJJ to Monday KB
        startTime: "19:00",
        endTime: "20:30",
      });

      const result = await updateClassSlot("sched_1", fd);
      expect(result.success).toBe(true);

      const slots = await testDb
        .select()
        .from(schema.schedule)
        .where(eq(schema.schedule.id, "sched_1"));
      expect(slots[0].sportId).toBe("sport_kb");
      expect(slots[0].startTime).toBe("19:00");
      expect(slots[0].endTime).toBe("20:30");
    });

    it("rejects invalid data on update", async () => {
      const fd = makeFormData({
        sportId: "",
        dayOfWeek: "1",
        startTime: "18:00",
      });

      const result = await updateClassSlot("sched_1", fd);
      expect(result.success).toBe(false);
    });
  });

  describe("removeClassSlot", () => {
    it("deletes a schedule slot", async () => {
      const result = await removeClassSlot("sched_2");
      expect(result.success).toBe(true);

      const slots = await testDb
        .select()
        .from(schema.schedule)
        .where(eq(schema.schedule.id, "sched_2"));
      expect(slots).toHaveLength(0);
    });

    it("does not affect other slots", async () => {
      await removeClassSlot("sched_2");

      const remaining = await testDb.select().from(schema.schedule);
      expect(remaining).toHaveLength(2); // sched_1 and sched_3 remain
    });
  });

  describe("auth guards", () => {
    it("rejects unauthenticated addClassSlot", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const fd = makeFormData({
        sportId: "sport_mma",
        dayOfWeek: "4",
        startTime: "17:00",
        endTime: "18:30",
      });
      const result = await addClassSlot(fd);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member-role removeClassSlot", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });
      const result = await removeClassSlot("sched_1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects unauthenticated updateClassSlot", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const fd = makeFormData({
        sportId: "sport_kb",
        dayOfWeek: "1",
        startTime: "19:00",
        endTime: "20:30",
      });
      const result = await updateClassSlot("sched_1", fd);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member-role addClassSlot", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });
      const fd = makeFormData({
        sportId: "sport_mma",
        dayOfWeek: "4",
        startTime: "17:00",
      });
      const result = await addClassSlot(fd);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member-role updateClassSlot", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });
      const fd = makeFormData({
        sportId: "sport_kb",
        dayOfWeek: "1",
        startTime: "19:00",
      });
      const result = await updateClassSlot("sched_1", fd);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("cache revalidation", () => {
    it("revalidates all schedule-consuming paths after addClassSlot", async () => {
      const fd = makeFormData({
        sportId: "sport_mma",
        dayOfWeek: "4",
        startTime: "17:00",
        endTime: "18:30",
      });

      await addClassSlot(fd);

      for (const path of EXPECTED_REVALIDATION_PATHS) {
        expect(mockRevalidatePath).toHaveBeenCalledWith(path);
      }
      expect(mockRevalidatePath).toHaveBeenCalledTimes(
        EXPECTED_REVALIDATION_PATHS.length,
      );
    });

    it("revalidates all schedule-consuming paths after updateClassSlot", async () => {
      const fd = makeFormData({
        sportId: "sport_kb",
        dayOfWeek: "1",
        startTime: "19:00",
        endTime: "20:30",
      });

      await updateClassSlot("sched_1", fd);

      for (const path of EXPECTED_REVALIDATION_PATHS) {
        expect(mockRevalidatePath).toHaveBeenCalledWith(path);
      }
      expect(mockRevalidatePath).toHaveBeenCalledTimes(
        EXPECTED_REVALIDATION_PATHS.length,
      );
    });

    it("revalidates all schedule-consuming paths after removeClassSlot", async () => {
      await removeClassSlot("sched_2");

      for (const path of EXPECTED_REVALIDATION_PATHS) {
        expect(mockRevalidatePath).toHaveBeenCalledWith(path);
      }
      expect(mockRevalidatePath).toHaveBeenCalledTimes(
        EXPECTED_REVALIDATION_PATHS.length,
      );
    });

    it("does NOT revalidate when addClassSlot fails validation", async () => {
      const fd = makeFormData({
        sportId: "",
        dayOfWeek: "1",
        startTime: "18:00",
      });

      await addClassSlot(fd);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("does NOT revalidate when updateClassSlot fails validation", async () => {
      const fd = makeFormData({
        sportId: "",
        dayOfWeek: "1",
        startTime: "18:00",
      });

      await updateClassSlot("sched_1", fd);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("does NOT revalidate when auth fails", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const fd = makeFormData({
        sportId: "sport_mma",
        dayOfWeek: "4",
        startTime: "17:00",
      });

      await addClassSlot(fd);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("does NOT revalidate when member role attempts removeClassSlot", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });

      await removeClassSlot("sched_1");

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});
