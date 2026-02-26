"use server";

import { signIn, signOut, auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { credentialsSchema } from "@/lib/validators";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    return { success: true, error: null };
  } catch (error) {
    if (isRedirectError(error)) {
      // NextAuth internally throws a redirect - this means success
      return { success: true, error: null };
    }
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid username or password" };
    }
    return { success: false, error: "Invalid username or password" };
  }
}

export async function logoutAction() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
  }
}

export async function createMemberCredentials(
  memberId: string,
  username: string,
  password: string
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = credentialsSchema.safeParse({ username, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.username, parsed.data.username),
    });
    if (existing) {
      return { success: false, error: "Username already exists" };
    }

    const passwordHash = hashSync(parsed.data.password, 12);
    await db.insert(users).values({
      id: createId(),
      username: parsed.data.username,
      passwordHash,
      role: "member",
      memberId,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to create member credentials:", error);
    return { success: false, error: "Failed to create member credentials" };
  }
}
