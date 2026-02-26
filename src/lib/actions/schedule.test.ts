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

const { addClassSlot, updateClassSlot, removeClassSlot } = await import(
  "./schedule"
);

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

describe("schedule actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
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
        sportId: "sport_wr",
        dayOfWeek: "5", // Friday
        startTime: "16:00",
        endTime: "",
      });

      const result = await addClassSlot(fd);
      expect(result.success).toBe(true);

      const slots = await testDb
        .select()
        .from(schema.schedule)
        .where(eq(schema.schedule.sportId, "sport_wr"));
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
});
