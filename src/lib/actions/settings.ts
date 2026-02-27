"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { tierPricingSchema, changePasswordSchema } from "@/lib/validators";
import { compareSync, hashSync } from "bcryptjs";

export async function updateTierPricing(tierId: string, newPrice: number) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const parsed = tierPricingSchema.safeParse({ monthlyPriceMkd: newPrice });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    await db
      .update(schema.membershipTiers)
      .set({
        monthlyPriceMkd: parsed.data.monthlyPriceMkd,
        updatedAt: new Date(),
      })
      .where(eq(schema.membershipTiers.id, tierId));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/payments");
    return { success: true };
  } catch (error) {
    console.error("Failed to update tier pricing:", error);
    return { success: false, error: "Failed to update tier pricing" };
  }
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.user.id),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isCurrentValid = compareSync(
      parsed.data.currentPassword,
      user.passwordHash
    );
    if (!isCurrentValid) {
      return { success: false, error: "wrongPassword" };
    }

    const newHash = hashSync(parsed.data.newPassword, 12);

    await db
      .update(schema.users)
      .set({ passwordHash: newHash })
      .where(eq(schema.users.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Failed to change password:", error);
    return { success: false, error: "Failed to change password" };
  }
}
