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

const { createMember, updateMember, toggleMemberStatus, deleteMember } =
  await import("./members");

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

describe("members actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    testClient = setup.client;
    await seedTestData(testDb);
  });

  describe("createMember", () => {
    it("creates a member with valid data", async () => {
      const fd = makeFormData({
        fullName: "Nikola Stojanovski",
        membershipTierId: "tier_basic",
        joinDate: "2026-02-01",
        phone: "+389 70 333 333",
        email: "nikola@test.com",
        beltRank: "white",
        selectedSports: "sport_bjj",
      });

      const result = await createMember(fd);
      expect(result.success).toBe(true);
      expect(result.memberId).toBeDefined();

      // Verify in database
      const members = await testDb
        .select()
        .from(schema.members)
        .where(eq(schema.members.fullName, "Nikola Stojanovski"));
      expect(members).toHaveLength(1);
      expect(members[0].phone).toBe("+389 70 333 333");

      // Verify sport was attached
      const sports = await testDb
        .select()
        .from(schema.memberSports)
        .where(eq(schema.memberSports.memberId, members[0].id));
      expect(sports).toHaveLength(1);
      expect(sports[0].sportId).toBe("sport_bjj");
    });

    it("creates a member with minimal required fields", async () => {
      const fd = makeFormData({
        fullName: "Minimal Member",
        membershipTierId: "tier_basic",
        joinDate: "2026-01-01",
      });

      const result = await createMember(fd);
      expect(result.success).toBe(true);
    });

    it("returns error for invalid data (missing fullName)", async () => {
      const fd = makeFormData({
        fullName: "",
        membershipTierId: "tier_basic",
        joinDate: "2026-01-01",
      });

      const result = await createMember(fd);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("returns error for missing membership tier", async () => {
      const fd = makeFormData({
        fullName: "Test Person",
        membershipTierId: "",
        joinDate: "2026-01-01",
      });

      const result = await createMember(fd);
      expect(result.success).toBe(false);
    });

    it("creates member with multiple sports", async () => {
      const fd = makeFormData({
        fullName: "Multi Sport Person",
        membershipTierId: "tier_standard",
        joinDate: "2026-02-01",
        selectedSports: "sport_bjj,sport_kb",
      });

      const result = await createMember(fd);
      expect(result.success).toBe(true);

      const sports = await testDb
        .select()
        .from(schema.memberSports)
        .where(eq(schema.memberSports.memberId, result.memberId!));
      expect(sports).toHaveLength(2);
    });
  });

  describe("updateMember", () => {
    it("updates member fields", async () => {
      const fd = makeFormData({
        fullName: "Stefan Updated",
        membershipTierId: "tier_standard",
        joinDate: "2025-10-01",
        phone: "+389 70 999 999",
        email: "stefan_new@test.com",
        beltRank: "blue",
        selectedSports: "sport_bjj,sport_kb",
      });

      const result = await updateMember("member_1", fd);
      expect(result.success).toBe(true);

      // Verify in database
      const members = await testDb
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, "member_1"));
      expect(members[0].fullName).toBe("Stefan Updated");
      expect(members[0].membershipTierId).toBe("tier_standard");
      expect(members[0].beltRank).toBe("blue");
    });

    it("replaces sports on update", async () => {
      const fd = makeFormData({
        fullName: "Stefan Petrovic",
        membershipTierId: "tier_basic",
        joinDate: "2025-10-01",
        selectedSports: "sport_kb,sport_mma",
      });

      await updateMember("member_1", fd);

      // Old sport (BJJ) should be removed, new ones added
      const sports = await testDb
        .select()
        .from(schema.memberSports)
        .where(eq(schema.memberSports.memberId, "member_1"));
      expect(sports).toHaveLength(2);
      const sportIds = sports.map((s) => s.sportId).sort();
      expect(sportIds).toEqual(["sport_kb", "sport_mma"]);
    });

    it("returns error for invalid data", async () => {
      const fd = makeFormData({
        fullName: "",
        membershipTierId: "tier_basic",
        joinDate: "2025-10-01",
      });

      const result = await updateMember("member_1", fd);
      expect(result.success).toBe(false);
    });
  });

  describe("toggleMemberStatus", () => {
    it("flips active to inactive", async () => {
      const result = await toggleMemberStatus("member_1");
      expect(result.success).toBe(true);

      const members = await testDb
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, "member_1"));
      expect(members[0].isActive).toBe(false);
    });

    it("flips inactive to active", async () => {
      // member_3 is inactive
      const result = await toggleMemberStatus("member_3");
      expect(result.success).toBe(true);

      const members = await testDb
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, "member_3"));
      expect(members[0].isActive).toBe(true);
    });

    it("returns error for non-existent member", async () => {
      const result = await toggleMemberStatus("non_existent");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Member not found");
    });
  });

  describe("deleteMember", () => {
    it("removes member from database", async () => {
      // Use member_2 which has no user account referencing it (no FK conflict)
      const result = await deleteMember("member_2");
      expect(result.success).toBe(true);

      const members = await testDb
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, "member_2"));
      expect(members).toHaveLength(0);
    });

    it("cascades delete to member_sports", async () => {
      // member_2 has sports (BJJ, Kickboxing) and no user account
      await deleteMember("member_2");

      const sports = await testDb
        .select()
        .from(schema.memberSports)
        .where(eq(schema.memberSports.memberId, "member_2"));
      expect(sports).toHaveLength(0);
    });

    it("returns success even for member with user account after clearing FK", async () => {
      // member_1 has a user account referencing it.
      // First clear the user reference, then delete.
      await testDb
        .delete(schema.users)
        .where(eq(schema.users.memberId, "member_1"));

      const result = await deleteMember("member_1");
      expect(result.success).toBe(true);
    });
  });
});
