import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import * as schema from "@/db/schema";

let testDb: TestDb;

vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

// Dynamic import AFTER mocks
const { getFullSchedule, getScheduleForDay, getScheduleById } = await import(
  "./schedule"
);

describe("schedule queries", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
  });

  // =============================================
  // getFullSchedule
  // =============================================
  describe("getFullSchedule", () => {
    it("returns all active schedule slots grouped by dayOfWeek", async () => {
      const grouped = await getFullSchedule();

      // Seed has 3 active slots on days 1 (Mon), 2 (Tue), 3 (Wed)
      expect(Object.keys(grouped).map(Number).sort()).toEqual([1, 2, 3]);
    });

    it("groups Monday BJJ slot under dayOfWeek 1", async () => {
      const grouped = await getFullSchedule();

      expect(grouped[1]).toHaveLength(1);
      expect(grouped[1][0]).toMatchObject({
        id: "sched_1",
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "19:30",
        sportId: "sport_bjj",
        sportName: "BJJ",
        sportColor: "#DC2626",
      });
    });

    it("groups Tuesday Kickboxing slot under dayOfWeek 2", async () => {
      const grouped = await getFullSchedule();

      expect(grouped[2]).toHaveLength(1);
      expect(grouped[2][0]).toMatchObject({
        id: "sched_2",
        dayOfWeek: 2,
        startTime: "19:00",
        endTime: "20:30",
        sportName: "Kickboxing",
      });
    });

    it("groups Wednesday BJJ slot under dayOfWeek 3", async () => {
      const grouped = await getFullSchedule();

      expect(grouped[3]).toHaveLength(1);
      expect(grouped[3][0]).toMatchObject({
        id: "sched_3",
        dayOfWeek: 3,
        startTime: "18:00",
        endTime: "19:30",
        sportName: "BJJ",
      });
    });

    it("excludes inactive schedule slots", async () => {
      // Insert an inactive slot
      await testDb.insert(schema.schedule).values({
        id: "sched_inactive",
        sportId: "sport_mma",
        dayOfWeek: 4, // Thursday
        startTime: "20:00",
        endTime: "21:30",
        isActive: false,
      });

      const grouped = await getFullSchedule();

      // Thursday should not appear
      expect(grouped[4]).toBeUndefined();
      expect(Object.keys(grouped).map(Number).sort()).toEqual([1, 2, 3]);
    });

    it("sorts slots within the same day by startTime", async () => {
      // Add an earlier BJJ slot on Monday
      await testDb.insert(schema.schedule).values({
        id: "sched_early_mon",
        sportId: "sport_mma",
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "11:30",
        isActive: true,
      });

      const grouped = await getFullSchedule();

      expect(grouped[1]).toHaveLength(2);
      expect(grouped[1][0].startTime).toBe("10:00");
      expect(grouped[1][1].startTime).toBe("18:00");
    });

    it("returns an empty object when no active slots exist", async () => {
      // Deactivate all slots
      await testDb
        .update(schema.schedule)
        .set({ isActive: false });

      const grouped = await getFullSchedule();

      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it("includes sport join data (name and color) on every slot", async () => {
      const grouped = await getFullSchedule();

      for (const daySlots of Object.values(grouped)) {
        for (const slot of daySlots) {
          expect(slot).toHaveProperty("sportName");
          expect(slot).toHaveProperty("sportColor");
          expect(slot.sportName).toBeTruthy();
        }
      }
    });
  });

  // =============================================
  // getScheduleForDay
  // =============================================
  describe("getScheduleForDay", () => {
    it("returns slots for Monday (day 1)", async () => {
      const slots = await getScheduleForDay(1);

      expect(slots).toHaveLength(1);
      expect(slots[0]).toMatchObject({
        id: "sched_1",
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "19:30",
        sportName: "BJJ",
        sportColor: "#DC2626",
      });
    });

    it("returns slots for Tuesday (day 2)", async () => {
      const slots = await getScheduleForDay(2);

      expect(slots).toHaveLength(1);
      expect(slots[0]).toMatchObject({
        id: "sched_2",
        sportName: "Kickboxing",
      });
    });

    it("returns slots for Wednesday (day 3)", async () => {
      const slots = await getScheduleForDay(3);

      expect(slots).toHaveLength(1);
      expect(slots[0]).toMatchObject({
        id: "sched_3",
        sportName: "BJJ",
      });
    });

    it("returns an empty array for a day with no active slots", async () => {
      const slots = await getScheduleForDay(0); // Sunday

      expect(slots).toEqual([]);
    });

    it("excludes inactive slots for the given day", async () => {
      // Add an inactive slot on Monday
      await testDb.insert(schema.schedule).values({
        id: "sched_mon_inactive",
        sportId: "sport_mma",
        dayOfWeek: 1,
        startTime: "20:00",
        endTime: "21:30",
        isActive: false,
      });

      const slots = await getScheduleForDay(1);

      // Still only the one active Monday slot
      expect(slots).toHaveLength(1);
      expect(slots[0].id).toBe("sched_1");
    });

    it("sorts multiple slots on the same day by startTime", async () => {
      // Add an earlier slot on Monday
      await testDb.insert(schema.schedule).values({
        id: "sched_mon_early",
        sportId: "sport_kb",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:30",
        isActive: true,
      });

      const slots = await getScheduleForDay(1);

      expect(slots).toHaveLength(2);
      expect(slots[0].startTime).toBe("09:00");
      expect(slots[1].startTime).toBe("18:00");
    });

    it("returns all active slots when multiple exist on the same day", async () => {
      // Add two more slots on Wednesday
      await testDb.insert(schema.schedule).values([
        {
          id: "sched_wed_2",
          sportId: "sport_kb",
          dayOfWeek: 3,
          startTime: "10:00",
          endTime: "11:30",
          isActive: true,
        },
        {
          id: "sched_wed_3",
          sportId: "sport_mma",
          dayOfWeek: 3,
          startTime: "20:00",
          endTime: "21:30",
          isActive: true,
        },
      ]);

      const slots = await getScheduleForDay(3);

      expect(slots).toHaveLength(3);
      expect(slots.map((s) => s.id)).toEqual([
        "sched_wed_2",
        "sched_3",
        "sched_wed_3",
      ]);
    });

    it("handles Saturday (day 6) with no slots", async () => {
      const slots = await getScheduleForDay(6);
      expect(slots).toEqual([]);
    });
  });

  // =============================================
  // getScheduleById
  // =============================================
  describe("getScheduleById", () => {
    it("returns a schedule slot by its ID", async () => {
      const slot = await getScheduleById("sched_1");

      expect(slot).not.toBeNull();
      expect(slot).toMatchObject({
        id: "sched_1",
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "19:30",
        isActive: true,
        sportId: "sport_bjj",
        sportName: "BJJ",
        sportColor: "#DC2626",
      });
    });

    it("returns the Kickboxing slot by ID", async () => {
      const slot = await getScheduleById("sched_2");

      expect(slot).not.toBeNull();
      expect(slot).toMatchObject({
        id: "sched_2",
        dayOfWeek: 2,
        startTime: "19:00",
        endTime: "20:30",
        isActive: true,
        sportName: "Kickboxing",
        sportColor: "#EAB308",
      });
    });

    it("returns null for a non-existent ID", async () => {
      const slot = await getScheduleById("sched_nonexistent");
      expect(slot).toBeNull();
    });

    it("returns inactive slots (getScheduleById does not filter by isActive)", async () => {
      // Insert an inactive slot
      await testDb.insert(schema.schedule).values({
        id: "sched_inactive_by_id",
        sportId: "sport_mma",
        dayOfWeek: 5,
        startTime: "17:00",
        endTime: "18:30",
        isActive: false,
      });

      const slot = await getScheduleById("sched_inactive_by_id");

      expect(slot).not.toBeNull();
      expect(slot!.isActive).toBe(false);
      expect(slot!.sportName).toBe("MMA");
    });

    it("includes the isActive field in the result", async () => {
      const slot = await getScheduleById("sched_1");

      expect(slot).not.toBeNull();
      expect(slot).toHaveProperty("isActive");
      expect(typeof slot!.isActive).toBe("boolean");
    });

    it("includes sport join data", async () => {
      const slot = await getScheduleById("sched_3");

      expect(slot).not.toBeNull();
      expect(slot!.sportId).toBe("sport_bjj");
      expect(slot!.sportName).toBe("BJJ");
      expect(slot!.sportColor).toBe("#DC2626");
    });

    it("returns null for an empty string ID", async () => {
      const slot = await getScheduleById("");
      expect(slot).toBeNull();
    });
  });
});
