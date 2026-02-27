import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { hashSync } from "bcryptjs";

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

const { updateTierPricing, changePassword } = await import("./settings");

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

  describe("changePassword", () => {
    const KNOWN_PASSWORD = "OldPass123";

    beforeEach(async () => {
      // Insert a user with a real bcrypt hash matching the mocked session user ID
      const hash = hashSync(KNOWN_PASSWORD, 4); // low rounds for test speed
      await testDb.insert(schema.users).values({
        id: "admin_user",
        username: "testadmin",
        passwordHash: hash,
        role: "admin",
        memberId: null,
      });
    });

    it("changes password with valid current password", async () => {
      const result = await changePassword({
        currentPassword: KNOWN_PASSWORD,
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });
      expect(result.success).toBe(true);

      // Verify the password was actually updated in the database
      const users = await testDb
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, "admin_user"));
      // New hash should differ from old hash
      expect(users[0].passwordHash).not.toBe(hashSync(KNOWN_PASSWORD, 4));
    });

    it("rejects wrong current password", async () => {
      const result = await changePassword({
        currentPassword: "WrongPassword",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("wrongPassword");
    });

    it("rejects mismatched new/confirm passwords", async () => {
      const result = await changePassword({
        currentPassword: KNOWN_PASSWORD,
        newPassword: "NewPass456",
        confirmPassword: "DifferentPass789",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects short new password (5 chars)", async () => {
      const result = await changePassword({
        currentPassword: KNOWN_PASSWORD,
        newPassword: "12345",
        confirmPassword: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty current password", async () => {
      const result = await changePassword({
        currentPassword: "",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });
      expect(result.success).toBe(false);
    });

    it("does not change password when current is wrong", async () => {
      const userBefore = await testDb
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, "admin_user"));
      const hashBefore = userBefore[0].passwordHash;

      await changePassword({
        currentPassword: "WrongPassword",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });

      const userAfter = await testDb
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, "admin_user"));
      expect(userAfter[0].passwordHash).toBe(hashBefore);
    });
  });

  describe("auth guards", () => {
    it("rejects unauthenticated updateTierPricing", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await updateTierPricing("tier_basic", 2000);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member-role updateTierPricing", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });
      const result = await updateTierPricing("tier_basic", 2000);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects unauthenticated changePassword", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await changePassword({
        currentPassword: "any",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member-role changePassword", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "member_user", username: "member1", role: "member", memberId: "member_1" },
      });
      const result = await changePassword({
        currentPassword: "any",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });
});
