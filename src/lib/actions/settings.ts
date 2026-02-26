"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { tierPricingSchema } from "@/lib/validators";

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
