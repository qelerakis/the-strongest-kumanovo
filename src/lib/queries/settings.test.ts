import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";

let testDb: TestDb;

vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

// Dynamic import AFTER mocks
const { getMembershipTiers, getAllSports } = await import("./settings");

describe("settings queries", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
  });

  describe("getMembershipTiers", () => {
    it("returns all three seeded tiers", async () => {
      const tiers = await getMembershipTiers();
      expect(tiers).toHaveLength(3);
    });

    it("returns tiers ordered by monthly price ascending", async () => {
      const tiers = await getMembershipTiers();
      expect(tiers[0].name).toBe("Basic");
      expect(tiers[0].monthlyPriceMkd).toBe(1500);
      expect(tiers[1].name).toBe("Standard");
      expect(tiers[1].monthlyPriceMkd).toBe(2500);
      expect(tiers[2].name).toBe("Premium");
      expect(tiers[2].monthlyPriceMkd).toBe(3500);
    });

    it("returns correct fields for each tier", async () => {
      const tiers = await getMembershipTiers();
      for (const tier of tiers) {
        expect(tier).toHaveProperty("id");
        expect(tier).toHaveProperty("name");
        expect(tier).toHaveProperty("nameKey");
        expect(tier).toHaveProperty("sportsAllowed");
        expect(tier).toHaveProperty("monthlyPriceMkd");
        expect(tier).toHaveProperty("isActive");
        expect(tier).toHaveProperty("updatedAt");
      }
    });

    it("returns correct sportsAllowed values", async () => {
      const tiers = await getMembershipTiers();
      const basic = tiers.find((t) => t.name === "Basic")!;
      const standard = tiers.find((t) => t.name === "Standard")!;
      const premium = tiers.find((t) => t.name === "Premium")!;

      expect(basic.sportsAllowed).toBe(1);
      expect(standard.sportsAllowed).toBe(2);
      expect(premium.sportsAllowed).toBe(-1); // unlimited
    });

    it("returns correct nameKey values", async () => {
      const tiers = await getMembershipTiers();
      const byName = Object.fromEntries(tiers.map((t) => [t.name, t]));

      expect(byName["Basic"].nameKey).toBe("basic");
      expect(byName["Standard"].nameKey).toBe("standard");
      expect(byName["Premium"].nameKey).toBe("premium");
    });

    it("returns all tiers as active", async () => {
      const tiers = await getMembershipTiers();
      for (const tier of tiers) {
        expect(tier.isActive).toBe(true);
      }
    });

    it("returns correct tier IDs", async () => {
      const tiers = await getMembershipTiers();
      const ids = tiers.map((t) => t.id);
      expect(ids).toContain("tier_basic");
      expect(ids).toContain("tier_standard");
      expect(ids).toContain("tier_premium");
    });

    it("returns empty array when no tiers exist", async () => {
      // Fresh DB with no seed data
      const freshSetup = await setupTestDb();
      testDb = freshSetup.db;

      const tiers = await getMembershipTiers();
      expect(tiers).toEqual([]);
    });
  });

  describe("getAllSports", () => {
    it("returns all three seeded sports", async () => {
      const sports = await getAllSports();
      expect(sports).toHaveLength(3);
    });

    it("returns sports ordered by name ascending", async () => {
      const sports = await getAllSports();
      // Alphabetical: BJJ, Kickboxing, MMA
      expect(sports[0].name).toBe("BJJ");
      expect(sports[1].name).toBe("Kickboxing");
      expect(sports[2].name).toBe("MMA");
    });

    it("returns correct fields for each sport", async () => {
      const sports = await getAllSports();
      for (const sport of sports) {
        expect(sport).toHaveProperty("id");
        expect(sport).toHaveProperty("name");
        expect(sport).toHaveProperty("nameKey");
        expect(sport).toHaveProperty("color");
      }
    });

    it("returns correct sport IDs", async () => {
      const sports = await getAllSports();
      const ids = sports.map((s) => s.id);
      expect(ids).toContain("sport_bjj");
      expect(ids).toContain("sport_kb");
      expect(ids).toContain("sport_mma");
    });

    it("returns correct nameKey values", async () => {
      const sports = await getAllSports();
      const byName = Object.fromEntries(sports.map((s) => [s.name, s]));

      expect(byName["BJJ"].nameKey).toBe("bjj");
      expect(byName["Kickboxing"].nameKey).toBe("kickboxing");
      expect(byName["MMA"].nameKey).toBe("mma");
    });

    it("returns correct color values", async () => {
      const sports = await getAllSports();
      const byName = Object.fromEntries(sports.map((s) => [s.name, s]));

      expect(byName["BJJ"].color).toBe("#DC2626");
      expect(byName["Kickboxing"].color).toBe("#EAB308");
      expect(byName["MMA"].color).toBe("#16A34A");
    });

    it("does not return fields beyond the selected columns", async () => {
      const sports = await getAllSports();
      // The query only selects id, name, nameKey, color — no createdAt
      const keys = Object.keys(sports[0]);
      expect(keys).toEqual(expect.arrayContaining(["id", "name", "nameKey", "color"]));
      expect(keys).not.toContain("createdAt");
    });

    it("returns empty array when no sports exist", async () => {
      const freshSetup = await setupTestDb();
      testDb = freshSetup.db;

      const sports = await getAllSports();
      expect(sports).toEqual([]);
    });
  });
});
