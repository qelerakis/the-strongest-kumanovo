import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { setupTestDb, seedTestData, type TestDb } from "@/test/db-setup";
import type { Client } from "@libsql/client";

let testDb: TestDb;
let testClient: Client;

// Mock @/db to return our test database
vi.mock("@/db", () => ({
  get db() {
    return testDb;
  },
}));

// Mock getCurrentMonth for predictable balance calculations
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    getCurrentMonth: () => "2026-02",
  };
});

// Import after mocks are set up
const { getAllMembers, getMemberById, getMemberBalance } = await import(
  "./members"
);

describe("members queries", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    testClient = setup.client;
    await seedTestData(testDb);
  });

  describe("getAllMembers", () => {
    it("returns all members with their sports", async () => {
      const members = await getAllMembers();
      expect(members).toHaveLength(3);

      // Members should be ordered by fullName
      expect(members[0].fullName).toBe("Ana Kostadinova");
      expect(members[1].fullName).toBe("Marko Nikolovski");
      expect(members[2].fullName).toBe("Stefan Petrovic");

      // Check sports are attached
      const ana = members.find((m) => m.fullName === "Ana Kostadinova");
      expect(ana!.sports).toHaveLength(2);
      expect(ana!.sports.map((s) => s.sportName).sort()).toEqual([
        "BJJ",
        "Kickboxing",
      ]);
    });

    it("filters by isActive = true", async () => {
      const members = await getAllMembers({ isActive: true });
      expect(members).toHaveLength(2);
      expect(members.every((m) => m.isActive === true)).toBe(true);
    });

    it("filters by isActive = false", async () => {
      const members = await getAllMembers({ isActive: false });
      expect(members).toHaveLength(1);
      expect(members[0].fullName).toBe("Marko Nikolovski");
    });

    it("filters by search string (name)", async () => {
      const members = await getAllMembers({ search: "Stefan" });
      expect(members).toHaveLength(1);
      expect(members[0].fullName).toBe("Stefan Petrovic");
    });

    it("filters by search string (partial match)", async () => {
      const members = await getAllMembers({ search: "ov" });
      // Ana Kostadinova, Marko Nikolovski, Stefan Petrovic - "ov" matches Ana and Marko
      expect(members.length).toBeGreaterThanOrEqual(2);
    });

    it("returns empty array for non-matching search", async () => {
      const members = await getAllMembers({ search: "zzzzz" });
      expect(members).toHaveLength(0);
    });

    it("filters by sportId", async () => {
      const members = await getAllMembers({ sportId: "sport_bjj" });
      expect(members).toHaveLength(2); // Stefan and Ana do BJJ
    });

    it("includes tier information", async () => {
      const members = await getAllMembers();
      const stefan = members.find((m) => m.fullName === "Stefan Petrovic");
      expect(stefan!.tierName).toBe("Basic");
      expect(stefan!.tierPrice).toBe(1500);
    });
  });

  describe("getMemberById", () => {
    it("returns member with sports and user info", async () => {
      const member = await getMemberById("member_1");
      expect(member).not.toBeNull();
      expect(member!.fullName).toBe("Stefan Petrovic");
      expect(member!.sports).toHaveLength(1);
      expect(member!.sports[0].sportName).toBe("BJJ");
      expect(member!.user).not.toBeNull();
      expect(member!.user!.username).toBe("stefan");
    });

    it("returns null for non-existent member", async () => {
      const member = await getMemberById("non_existent");
      expect(member).toBeNull();
    });

    it("returns member without user account (member_2 has no user)", async () => {
      const member = await getMemberById("member_2");
      expect(member).not.toBeNull();
      expect(member!.fullName).toBe("Ana Kostadinova");
      expect(member!.user).toBeNull();
    });

    it("includes tier details", async () => {
      const member = await getMemberById("member_1");
      expect(member!.tierName).toBe("Basic");
      expect(member!.tierPrice).toBe(1500);
      expect(member!.sportsAllowed).toBe(1);
    });
  });

  describe("getMemberBalance", () => {
    it("computes balance for member with payments covering all months", async () => {
      // member_1 joined 2025-10, current month is 2026-02
      // Months: 2025-10, 2025-11, 2025-12, 2026-01, 2026-02 = 5 months
      // Tier price: 1500 MKD/month => totalOwed = 7500
      // Payments: 1500 + 1500 = 3000 => totalPaid = 3000
      // Balance: 3000 - 7500 = -4500 (debt)
      const balance = await getMemberBalance("member_1");
      expect(balance).not.toBeNull();
      expect(balance!.totalOwed).toBe(7500);
      expect(balance!.totalPaid).toBe(3000);
      expect(balance!.balance).toBe(-4500);
      expect(balance!.isCredit).toBe(false);
    });

    it("computes balance for member_2", async () => {
      // member_2 joined 2025-11, current month is 2026-02
      // Months: 2025-11, 2025-12, 2026-01, 2026-02 = 4 months
      // Tier price: 2500 MKD/month => totalOwed = 10000
      // Payments: 2500 => totalPaid = 2500
      // Balance: 2500 - 10000 = -7500 (debt)
      const balance = await getMemberBalance("member_2");
      expect(balance).not.toBeNull();
      expect(balance!.totalOwed).toBe(10000);
      expect(balance!.totalPaid).toBe(2500);
      expect(balance!.balance).toBe(-7500);
      expect(balance!.isCredit).toBe(false);
    });

    it("returns null for non-existent member", async () => {
      const balance = await getMemberBalance("non_existent");
      expect(balance).toBeNull();
    });

    it("shows credit when totalPaid > totalOwed", async () => {
      // Add extra payments to member_1 to create a credit
      const { payments } = await import("@/db/schema");
      await testDb.insert(payments).values([
        {
          id: "pay_extra_1",
          memberId: "member_1",
          amountMkd: 3000,
          paymentDate: "2025-12-01",
          monthFor: "2025-12",
        },
        {
          id: "pay_extra_2",
          memberId: "member_1",
          amountMkd: 3000,
          paymentDate: "2025-11-01",
          monthFor: "2025-11",
        },
      ]);

      // Now totalPaid = 3000 + 3000 + 3000 = 9000, totalOwed = 7500
      const balance = await getMemberBalance("member_1");
      expect(balance!.totalPaid).toBe(9000);
      expect(balance!.balance).toBe(1500);
      expect(balance!.isCredit).toBe(true);
    });
  });
});
