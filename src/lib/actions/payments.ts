"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { paymentSchema } from "@/lib/validators";

export async function logPayment(formData: FormData) {
  try {
    const raw = {
      memberId: formData.get("memberId") as string,
      amountMkd: Number(formData.get("amountMkd")),
      paymentDate: formData.get("paymentDate") as string,
      monthFor: formData.get("monthFor") as string,
      notes: (formData.get("notes") as string) || undefined,
    };

    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    await db.insert(schema.payments).values({
      memberId: parsed.data.memberId,
      amountMkd: parsed.data.amountMkd,
      paymentDate: parsed.data.paymentDate,
      monthFor: parsed.data.monthFor,
      notes: parsed.data.notes ?? null,
    });

    revalidatePath("/dashboard/payments");
    return { success: true };
  } catch (error) {
    console.error("Failed to log payment:", error);
    return { success: false, error: "Failed to log payment" };
  }
}

export async function deletePayment(id: string) {
  try {
    await db.delete(schema.payments).where(eq(schema.payments.id, id));

    revalidatePath("/dashboard/payments");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}
