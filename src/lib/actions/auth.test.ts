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

// next-auth pulls in next/server which doesn't resolve in vitest.
// Mock the entire next-auth ecosystem before importing auth actions.
vi.mock("next-auth", () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {},
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: vi.fn().mockReturnValue(false),
}));

const mockAuth = vi.fn().mockResolvedValue({
  user: { id: "admin_user", username: "admin", role: "admin", memberId: null },
});

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const { createMemberCredentials } = await import("./auth");

describe("auth actions", () => {
  beforeEach(async () => {
    const setup = await setupTestDb();
    testDb = setup.db;
    await seedTestData(testDb);
    mockAuth.mockResolvedValue({
      user: { id: "admin_user", username: "admin", role: "admin", memberId: null },
    });
  });

  describe("createMemberCredentials", () => {
    it("creates user credentials for a member", async () => {
      const result = await createMemberCredentials(
        "member_2",
        "ana_k",
        "password123"
      );
      expect(result.success).toBe(true);

      const users = await testDb
        .select()
        .from(schema.users)
        .where(eq(schema.users.memberId, "member_2"));
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe("ana_k");
      expect(users[0].role).toBe("member");
    });

    it("hashes the password (not stored plaintext)", async () => {
      await createMemberCredentials("member_2", "ana_k", "password123");

      const users = await testDb
        .select()
        .from(schema.users)
        .where(eq(schema.users.memberId, "member_2"));
      expect(users[0].passwordHash).not.toBe("password123");
      expect(users[0].passwordHash.startsWith("$2")).toBe(true);
    });

    it("rejects duplicate username", async () => {
      const result = await createMemberCredentials(
        "member_2",
        "stefan",
        "password123"
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Username already exists");
    });

    it("rejects username shorter than 3 characters", async () => {
      const result = await createMemberCredentials(
        "member_2",
        "ab",
        "password123"
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects password shorter than 6 characters", async () => {
      const result = await createMemberCredentials(
        "member_2",
        "ana_k",
        "12345"
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects unauthenticated user", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const result = await createMemberCredentials(
        "member_2",
        "ana_k",
        "password123"
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("rejects member role", async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: "member_user",
          username: "stefan",
          role: "member",
          memberId: "member_1",
        },
      });
      const result = await createMemberCredentials(
        "member_2",
        "ana_k",
        "password123"
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });
});
