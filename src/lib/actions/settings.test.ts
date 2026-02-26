import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import type { Client } from "@libsql/client";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";

let testDb: TestDb;
let testClient: Client;

vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { updateTierPricing } = await import("./settings");

describe("settings actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    testClient = setup.client;
    await seedTestData(testDb);
  });

  describe("updateTierPricing", () => {
    it("updates tier price with valid positive integer", async () => {
      const result = await updateTierPricing("tier_basic", 2000);
      expect(result.success).toBe(true);

      const tiers = await testDb
        .select()
        .from(schema.membershipTiers)
        .where(eq(schema.membershipTiers.id, "tier_basic"));
      expect(tiers[0].monthlyPriceMkd).toBe(2000);
    });

    it("rejects zero price", async () => {
      const result = await updateTierPricing("tier_basic", 0);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects negative price", async () => {
      const result = await updateTierPricing("tier_basic", -100);
      expect(result.success).toBe(false);
    });

    it("rejects float price", async () => {
      const result = await updateTierPricing("tier_basic", 1500.5);
      expect(result.success).toBe(false);
    });

    it("does not affect other tiers", async () => {
      await updateTierPricing("tier_basic", 2000);

      const standard = await testDb
        .select()
        .from(schema.membershipTiers)
        .where(eq(schema.membershipTiers.id, "tier_standard"));
      expect(standard[0].monthlyPriceMkd).toBe(2500); // unchanged
    });
  });
});
