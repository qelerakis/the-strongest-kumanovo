"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { memberSchema } from "@/lib/validators";

export async function createMember(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const raw = {
      fullName: formData.get("fullName") as string,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || "",
      dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
      membershipTierId: formData.get("membershipTierId") as string,
      beltRank:
        (formData.get("beltRank") as string as
          | "white"
          | "blue"
          | "purple"
          | "brown"
          | "black") || undefined,
      joinDate: formData.get("joinDate") as string,
      notes: (formData.get("notes") as string) || undefined,
    };

    const parsed = memberSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const [member] = await db
      .insert(schema.members)
      .values({
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        dateOfBirth: parsed.data.dateOfBirth || null,
        membershipTierId: parsed.data.membershipTierId,
        beltRank: parsed.data.beltRank || "white",
        joinDate: parsed.data.joinDate,
        isActive: true,
        notes: parsed.data.notes || null,
      })
      .returning({ id: schema.members.id });

    // Insert member sports
    const selectedSports = (formData.get("selectedSports") as string) || "";
    if (selectedSports) {
      const sportIds = selectedSports.split(",").filter(Boolean);
      for (const sportId of sportIds) {
        await db.insert(schema.memberSports).values({
          memberId: member.id,
          sportId,
        });
      }
    }

    revalidatePath("/dashboard/members");
    return { success: true, memberId: member.id };
  } catch (error) {
    console.error("Failed to create member:", error);
    return { success: false, error: "Failed to create member" };
  }
}

export async function updateMember(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const raw = {
      fullName: formData.get("fullName") as string,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || "",
      dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
      membershipTierId: formData.get("membershipTierId") as string,
      beltRank:
        (formData.get("beltRank") as string as
          | "white"
          | "blue"
          | "purple"
          | "brown"
          | "black") || undefined,
      joinDate: formData.get("joinDate") as string,
      notes: (formData.get("notes") as string) || undefined,
    };

    const parsed = memberSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    await db
      .update(schema.members)
      .set({
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        dateOfBirth: parsed.data.dateOfBirth || null,
        membershipTierId: parsed.data.membershipTierId,
        beltRank: parsed.data.beltRank || "white",
        joinDate: parsed.data.joinDate,
        notes: parsed.data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.members.id, id));

    // Delete old sports and insert new ones
    await db
      .delete(schema.memberSports)
      .where(eq(schema.memberSports.memberId, id));

    const selectedSports = (formData.get("selectedSports") as string) || "";
    if (selectedSports) {
      const sportIds = selectedSports.split(",").filter(Boolean);
      for (const sportId of sportIds) {
        await db.insert(schema.memberSports).values({
          memberId: id,
          sportId,
        });
      }
    }

    revalidatePath("/dashboard/members");
    revalidatePath(`/dashboard/members/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update member:", error);
    return { success: false, error: "Failed to update member" };
  }
}

export async function toggleMemberStatus(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get current status
    const result = await db
      .select({ isActive: schema.members.isActive })
      .from(schema.members)
      .where(eq(schema.members.id, id))
      .limit(1);

    if (!result[0]) {
      return { success: false, error: "Member not found" };
    }

    await db
      .update(schema.members)
      .set({
        isActive: !result[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.members.id, id));

    revalidatePath("/dashboard/members");
    revalidatePath(`/dashboard/members/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle member status:", error);
    return { success: false, error: "Failed to toggle member status" };
  }
}

export async function deleteMember(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.delete(schema.members).where(eq(schema.members.id, id));

    revalidatePath("/dashboard/members");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete member:", error);
    return { success: false, error: "Failed to delete member" };
  }
}
