"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { paymentSchema } from "@/lib/validators";
import { incrementMonth } from "@/lib/utils";

export async function logPayment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const raw = {
      memberId: formData.get("memberId") as string,
      amountMkd: Number(formData.get("amountMkd")),
      paymentDate: formData.get("paymentDate") as string,
      monthFor: formData.get("monthFor") as string,
      numberOfMonths: Number(formData.get("numberOfMonths") || 1),
      notes: (formData.get("notes") as string) || undefined,
    };

    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const { memberId, amountMkd, paymentDate, monthFor, numberOfMonths, notes } = parsed.data;

    if (numberOfMonths === 1) {
      // Single month — existing behavior
      await db.insert(schema.payments).values({
        memberId,
        amountMkd,
        paymentDate,
        monthFor,
        notes: notes ?? null,
      });
    } else {
      // Multi-month advance payment — look up tier price for split
      const memberResult = await db
        .select({ tierPrice: schema.membershipTiers.monthlyPriceMkd })
        .from(schema.members)
        .innerJoin(
          schema.membershipTiers,
          eq(schema.members.membershipTierId, schema.membershipTiers.id)
        )
        .where(eq(schema.members.id, memberId))
        .limit(1);

      const tierPrice = memberResult[0]?.tierPrice ?? 0;

      // Guard: ensure the last month's split amount won't be zero or negative
      const lastMonthAmount = amountMkd - tierPrice * (numberOfMonths - 1);
      if (lastMonthAmount <= 0) {
        return {
          success: false,
          error: "Total amount is too low to split across the selected number of months",
        };
      }

      // Wrap in transaction for atomicity — all splits succeed or none do
      await db.transaction(async (tx) => {
        for (let i = 0; i < numberOfMonths; i++) {
          const isLast = i === numberOfMonths - 1;
          const monthAmount = isLast ? lastMonthAmount : tierPrice;

          // Notes are stored in English intentionally — payment records are shared
          // across EN/MK users, so mixed-language DB data would be worse.
          const advanceLabel = `Advance payment ${i + 1}/${numberOfMonths}`;
          const monthNotes = notes
            ? `${advanceLabel} — ${notes}`
            : advanceLabel;

          await tx.insert(schema.payments).values({
            memberId,
            amountMkd: monthAmount,
            paymentDate,
            monthFor: incrementMonth(monthFor, i),
            notes: monthNotes,
          });
        }
      });
    }

    revalidatePath("/dashboard/payments");
    return { success: true };
  } catch (error) {
    console.error("Failed to log payment:", error);
    return { success: false, error: "Failed to log payment" };
  }
}

export async function deletePayment(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.delete(schema.payments).where(eq(schema.payments.id, id));

    revalidatePath("/dashboard/payments");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}
