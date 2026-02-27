import { describe, it, expect, beforeEach } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import * as schema from "@/db/schema";
import enMessages from "../../messages/en.json";
import mkMessages from "../../messages/mk.json";

let testDb: TestDb;

describe("sports configuration", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
  });

  describe("seeded sports data", () => {
    it("seeds exactly 3 sports", async () => {
      const sports = await testDb.select().from(schema.sports);
      expect(sports).toHaveLength(3);
    });

    it("seeds BJJ, Kickboxing, and MMA only", async () => {
      const sports = await testDb.select().from(schema.sports);
      const names = sports.map((s) => s.name).sort();
      expect(names).toEqual(["BJJ", "Kickboxing", "MMA"]);
    });

    it("does not include Wrestling", async () => {
      const sports = await testDb.select().from(schema.sports);
      const names = sports.map((s) => s.name);
      expect(names).not.toContain("Wrestling");
    });

    it("stores nameKeys without namespace prefix", async () => {
      const sports = await testDb.select().from(schema.sports);
      for (const sport of sports) {
        expect(sport.nameKey).not.toContain(".");
        expect(sport.nameKey.startsWith("sports.")).toBe(false);
      }
    });

    it("has correct nameKey for each sport", async () => {
      const sports = await testDb.select().from(schema.sports);
      const keyMap = Object.fromEntries(sports.map((s) => [s.name, s.nameKey]));
      expect(keyMap["BJJ"]).toBe("bjj");
      expect(keyMap["Kickboxing"]).toBe("kickboxing");
      expect(keyMap["MMA"]).toBe("mma");
    });

    it("has a color assigned to each sport", async () => {
      const sports = await testDb.select().from(schema.sports);
      for (const sport of sports) {
        expect(sport.color).toBeTruthy();
        expect(sport.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe("seeded membership tiers", () => {
    it("seeds exactly 3 tiers", async () => {
      const tiers = await testDb.select().from(schema.membershipTiers);
      expect(tiers).toHaveLength(3);
    });

    it("seeds Basic, Standard, and Premium", async () => {
      const tiers = await testDb.select().from(schema.membershipTiers);
      const names = tiers.map((t) => t.name).sort();
      expect(names).toEqual(["Basic", "Premium", "Standard"]);
    });

    it("stores tier nameKeys without namespace prefix", async () => {
      const tiers = await testDb.select().from(schema.membershipTiers);
      for (const tier of tiers) {
        expect(tier.nameKey).not.toContain(".");
        expect(tier.nameKey.startsWith("tiers.")).toBe(false);
      }
    });

    it("has correct nameKey for each tier", async () => {
      const tiers = await testDb.select().from(schema.membershipTiers);
      const keyMap = Object.fromEntries(tiers.map((t) => [t.name, t.nameKey]));
      expect(keyMap["Basic"]).toBe("basic");
      expect(keyMap["Standard"]).toBe("standard");
      expect(keyMap["Premium"]).toBe("premium");
    });
  });

  describe("seeded schedule", () => {
    it("does not reference any non-existent sport", async () => {
      const sports = await testDb.select().from(schema.sports);
      const sportIds = new Set(sports.map((s) => s.id));

      const slots = await testDb.select().from(schema.schedule);
      for (const slot of slots) {
        expect(sportIds.has(slot.sportId)).toBe(true);
      }
    });

    it("only uses BJJ, Kickboxing, MMA sport IDs", async () => {
      const sports = await testDb.select().from(schema.sports);
      const sportIdToName = Object.fromEntries(
        sports.map((s) => [s.id, s.name])
      );

      const slots = await testDb.select().from(schema.schedule);
      const usedSportNames = [
        ...new Set(slots.map((s) => sportIdToName[s.sportId])),
      ].sort();

      for (const name of usedSportNames) {
        expect(["BJJ", "Kickboxing", "MMA"]).toContain(name);
      }
    });
  });
});

describe("translation files", () => {
  describe("English translations (en.json)", () => {
    it("has exactly 3 sport translations", () => {
      const sportKeys = Object.keys(enMessages.sports);
      expect(sportKeys).toHaveLength(3);
    });

    it("has BJJ, Kickboxing, MMA translations", () => {
      expect(enMessages.sports).toEqual({
        bjj: "BJJ",
        kickboxing: "Kickboxing",
        mma: "MMA",
      });
    });

    it("does not have a wrestling translation", () => {
      expect(enMessages.sports).not.toHaveProperty("wrestling");
    });

    it("has exactly 3 tier translations", () => {
      const tierKeys = Object.keys(enMessages.tiers);
      expect(tierKeys).toHaveLength(3);
    });

    it("has Basic, Standard, Premium tier translations", () => {
      expect(enMessages.tiers).toEqual({
        basic: "Basic",
        standard: "Standard",
        premium: "Premium",
      });
    });
  });

  describe("Macedonian translations (mk.json)", () => {
    it("has exactly 3 sport translations", () => {
      const sportKeys = Object.keys(mkMessages.sports);
      expect(sportKeys).toHaveLength(3);
    });

    it("has bjj, kickboxing, mma keys", () => {
      expect(mkMessages.sports).toHaveProperty("bjj");
      expect(mkMessages.sports).toHaveProperty("kickboxing");
      expect(mkMessages.sports).toHaveProperty("mma");
    });

    it("does not have a wrestling translation", () => {
      expect(mkMessages.sports).not.toHaveProperty("wrestling");
    });

    it("has exactly 3 tier translations", () => {
      const tierKeys = Object.keys(mkMessages.tiers);
      expect(tierKeys).toHaveLength(3);
    });

    it("has basic, standard, premium tier keys", () => {
      expect(mkMessages.tiers).toHaveProperty("basic");
      expect(mkMessages.tiers).toHaveProperty("standard");
      expect(mkMessages.tiers).toHaveProperty("premium");
    });
  });

  describe("translation key parity", () => {
    it("has same sport keys in both locales", () => {
      const enKeys = Object.keys(enMessages.sports).sort();
      const mkKeys = Object.keys(mkMessages.sports).sort();
      expect(enKeys).toEqual(mkKeys);
    });

    it("has same tier keys in both locales", () => {
      const enKeys = Object.keys(enMessages.tiers).sort();
      const mkKeys = Object.keys(mkMessages.tiers).sort();
      expect(enKeys).toEqual(mkKeys);
    });

    it("sport nameKeys from DB match translation keys", async () => {
      const setup = await setupTestDb();
      testDb = setup.db;
      await seedTestData(testDb);

      const sports = await testDb.select().from(schema.sports);
      const enSportKeys = Object.keys(enMessages.sports);

      for (const sport of sports) {
        expect(enSportKeys).toContain(sport.nameKey);
      }
    });

    it("tier nameKeys from DB match translation keys", async () => {
      const setup = await setupTestDb();
      testDb = setup.db;
      await seedTestData(testDb);

      const tiers = await testDb.select().from(schema.membershipTiers);
      const enTierKeys = Object.keys(enMessages.tiers);

      for (const tier of tiers) {
        expect(enTierKeys).toContain(tier.nameKey);
      }
    });
  });
});
