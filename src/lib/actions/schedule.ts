"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { scheduleSchema } from "@/lib/validators";

export async function addClassSlot(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const raw = {
      sportId: formData.get("sportId") as string,
      dayOfWeek: Number(formData.get("dayOfWeek")),
      startTime: formData.get("startTime") as string,
      endTime: (formData.get("endTime") as string) || "",
    };

    const parsed = scheduleSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    await db.insert(schema.schedule).values({
      sportId: parsed.data.sportId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime || null,
      isActive: true,
    });

    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to add class slot:", error);
    return { success: false, error: "Failed to add class slot" };
  }
}

export async function updateClassSlot(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const raw = {
      sportId: formData.get("sportId") as string,
      dayOfWeek: Number(formData.get("dayOfWeek")),
      startTime: formData.get("startTime") as string,
      endTime: (formData.get("endTime") as string) || "",
    };

    const parsed = scheduleSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    await db
      .update(schema.schedule)
      .set({
        sportId: parsed.data.sportId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime || null,
      })
      .where(eq(schema.schedule.id, id));

    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to update class slot:", error);
    return { success: false, error: "Failed to update class slot" };
  }
}

export async function removeClassSlot(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.delete(schema.schedule).where(eq(schema.schedule.id, id));

    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove class slot:", error);
    return { success: false, error: "Failed to remove class slot" };
  }
}
