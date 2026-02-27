import { describe, it, expect, beforeEach } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import * as schema from "@/db/schema";
import enMessages from "../../messages/en.json";
import mkMessages from "../../messages/mk.json";

let testDb: TestDb;

describe("schedule seed data", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
  });

  describe("schedule structure", () => {
    it("has schedule entries", async () => {
      const slots = await testDb.select().from(schema.schedule);
      expect(slots.length).toBeGreaterThan(0);
    });

    it("all dayOfWeek values are between 0 and 6", async () => {
      const slots = await testDb.select().from(schema.schedule);
      for (const slot of slots) {
        expect(slot.dayOfWeek).toBeGreaterThanOrEqual(0);
        expect(slot.dayOfWeek).toBeLessThanOrEqual(6);
      }
    });

    it("all startTime values are in HH:MM format", async () => {
      const slots = await testDb.select().from(schema.schedule);
      for (const slot of slots) {
        expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
      }
    });

    it("endTime is either null or in HH:MM format", async () => {
      const slots = await testDb.select().from(schema.schedule);
      for (const slot of slots) {
        if (slot.endTime !== null) {
          expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
        }
      }
    });

    it("all schedule entries reference valid sports", async () => {
      const sports = await testDb.select().from(schema.sports);
      const sportIds = new Set(sports.map((s) => s.id));
      const slots = await testDb.select().from(schema.schedule);

      for (const slot of slots) {
        expect(sportIds.has(slot.sportId)).toBe(true);
      }
    });

    it("has no duplicate entries (same sport + day + startTime)", async () => {
      const slots = await testDb.select().from(schema.schedule);
      const seen = new Set<string>();

      for (const slot of slots) {
        const key = `${slot.sportId}-${slot.dayOfWeek}-${slot.startTime}`;
        expect(seen.has(key), `Duplicate schedule entry: ${key}`).toBe(false);
        seen.add(key);
      }
    });

    it("all active flags default to true", async () => {
      const slots = await testDb.select().from(schema.schedule);
      for (const slot of slots) {
        expect(slot.isActive).toBe(true);
      }
    });
  });

  describe("sport names in schedule", () => {
    it("only uses BJJ, Kickboxing, or MMA", async () => {
      const sports = await testDb.select().from(schema.sports);
      const sportIdToName = Object.fromEntries(
        sports.map((s) => [s.id, s.name])
      );

      const slots = await testDb.select().from(schema.schedule);
      const usedNames = [...new Set(slots.map((s) => sportIdToName[s.sportId]))];

      for (const name of usedNames) {
        expect(["BJJ", "Kickboxing", "MMA"]).toContain(name);
      }
    });

    it("does not reference Wrestling", async () => {
      const sports = await testDb.select().from(schema.sports);
      const sportIdToName = Object.fromEntries(
        sports.map((s) => [s.id, s.name])
      );

      const slots = await testDb.select().from(schema.schedule);
      const usedNames = slots.map((s) => sportIdToName[s.sportId]);

      expect(usedNames).not.toContain("Wrestling");
    });
  });
});

describe("landing page i18n completeness", () => {
  describe("sport description keys match sport name keys", () => {
    it("every sport name key has a matching description key in EN", () => {
      const nameKeys = ["bjj", "kickboxing", "mma"];
      for (const key of nameKeys) {
        const descKey = `${key}Description`;
        expect(
          enMessages.sports,
          `Missing EN description key: ${descKey}`
        ).toHaveProperty(descKey);
      }
    });

    it("every sport name key has a matching description key in MK", () => {
      const nameKeys = ["bjj", "kickboxing", "mma"];
      for (const key of nameKeys) {
        const descKey = `${key}Description`;
        expect(
          mkMessages.sports,
          `Missing MK description key: ${descKey}`
        ).toHaveProperty(descKey);
      }
    });

    it("sport description keys in EN match those in MK", () => {
      const enDescKeys = Object.keys(enMessages.sports)
        .filter((k) => k.endsWith("Description"))
        .sort();
      const mkDescKeys = Object.keys(mkMessages.sports)
        .filter((k) => k.endsWith("Description"))
        .sort();
      expect(enDescKeys).toEqual(mkDescKeys);
    });
  });

  describe("contact section keys", () => {
    it("has contact label keys in EN landing section", () => {
      expect(enMessages.landing).toHaveProperty("contactAddress");
      expect(enMessages.landing).toHaveProperty("contactPhone");
      expect(enMessages.landing).toHaveProperty("contactEmail");
      expect(enMessages.landing).toHaveProperty("contactCountry");
    });

    it("has contact label keys in MK landing section", () => {
      expect(mkMessages.landing).toHaveProperty("contactAddress");
      expect(mkMessages.landing).toHaveProperty("contactPhone");
      expect(mkMessages.landing).toHaveProperty("contactEmail");
      expect(mkMessages.landing).toHaveProperty("contactCountry");
    });

    it("MK contact labels are in Macedonian (differ from EN)", () => {
      expect(mkMessages.landing.contactAddress).not.toBe(
        enMessages.landing.contactAddress
      );
      expect(mkMessages.landing.contactPhone).not.toBe(
        enMessages.landing.contactPhone
      );
      expect(mkMessages.landing.contactEmail).not.toBe(
        enMessages.landing.contactEmail
      );
      expect(mkMessages.landing.contactCountry).not.toBe(
        enMessages.landing.contactCountry
      );
    });
  });

  describe("schedule empty state", () => {
    it("has noClasses key in EN landing section", () => {
      expect(enMessages.landing).toHaveProperty("noClasses");
      expect(enMessages.landing.noClasses.length).toBeGreaterThan(0);
    });

    it("has noClasses key in MK landing section", () => {
      expect(mkMessages.landing).toHaveProperty("noClasses");
      expect(mkMessages.landing.noClasses.length).toBeGreaterThan(0);
    });

    it("noClasses is translated (differs between locales)", () => {
      expect(mkMessages.landing.noClasses).not.toBe(
        enMessages.landing.noClasses
      );
    });
  });
});

describe("landing page data consistency", () => {
  describe("sports showcase configuration", () => {
    // The sports-showcase.tsx component uses nameKey to look up translations.
    // Ensure the sport keys used in the component exist in translations.
    const SPORT_NAME_KEYS = ["bjj", "kickboxing", "mma"];

    it("all sport nameKeys have name translations in EN", () => {
      for (const key of SPORT_NAME_KEYS) {
        expect(enMessages.sports).toHaveProperty(key);
        expect(
          (enMessages.sports as Record<string, string>)[key].length
        ).toBeGreaterThan(0);
      }
    });

    it("all sport nameKeys have name translations in MK", () => {
      for (const key of SPORT_NAME_KEYS) {
        expect(mkMessages.sports).toHaveProperty(key);
        expect(
          (mkMessages.sports as Record<string, string>)[key].length
        ).toBeGreaterThan(0);
      }
    });

    it("all sport nameKeys have description translations in EN", () => {
      for (const key of SPORT_NAME_KEYS) {
        const descKey = `${key}Description`;
        expect(enMessages.sports).toHaveProperty(descKey);
      }
    });

    it("all sport nameKeys have description translations in MK", () => {
      for (const key of SPORT_NAME_KEYS) {
        const descKey = `${key}Description`;
        expect(mkMessages.sports).toHaveProperty(descKey);
      }
    });
  });

  describe("schedule display days", () => {
    // schedule-display.tsx uses DISPLAY_DAYS = [1, 2, 3, 4, 5, 6]
    const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6];

    it("all display days have translations in EN", () => {
      for (const day of DISPLAY_DAYS) {
        expect(enMessages.days).toHaveProperty(String(day));
      }
    });

    it("all display days have translations in MK", () => {
      for (const day of DISPLAY_DAYS) {
        expect(mkMessages.days).toHaveProperty(String(day));
      }
    });

    it("display days map to Mon-Sat", () => {
      const expectedDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      for (let i = 0; i < DISPLAY_DAYS.length; i++) {
        expect(enMessages.days[String(DISPLAY_DAYS[i]) as keyof typeof enMessages.days]).toBe(
          expectedDays[i]
        );
      }
    });
  });
});
