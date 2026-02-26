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

const mockAuth = vi.fn().mockResolvedValue({
  user: { id: "admin_user", username: "admin", role: "admin", memberId: null },
});

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const { updateTierPricing } = await import("./settings");

describe("settings actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
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

  describe("auth guards", () => {
    it("rejects unauthenticated requests", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await updateTierPricing("tier_basic", 2000);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member-role requests", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });
      const result = await updateTierPricing("tier_basic", 2000);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });
});
