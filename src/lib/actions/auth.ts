"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashSync } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

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
  const passwordHash = hashSync(password, 12);
  await db.insert(users).values({
    id: createId(),
    username,
    passwordHash,
    role: "member",
    memberId,
  });
  return { success: true };
}
