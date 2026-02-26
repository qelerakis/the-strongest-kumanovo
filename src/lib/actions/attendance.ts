"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  getClassSessionsForDate,
  getAttendanceForSession,
} from "@/lib/queries/attendance";
import { getAllMembers } from "@/lib/queries/members";

/**
 * Create a class session for a given schedule slot and date if it doesn't exist.
 * Returns the session ID.
 */
export async function openClassSession(scheduleId: string, date: string) {
  try {
    // Try to insert; if it already exists (unique constraint), do nothing
    await db
      .insert(schema.classSessions)
      .values({ scheduleId, date })
      .onConflictDoNothing();

    // Fetch the session (either newly created or existing)
    const result = await db
      .select({ id: schema.classSessions.id })
      .from(schema.classSessions)
      .where(
        and(
          eq(schema.classSessions.scheduleId, scheduleId),
          eq(schema.classSessions.date, date)
        )
      )
      .limit(1);

    if (!result[0]) {
      return { success: false, error: "Failed to create or find session" };
    }

    return { success: true, sessionId: result[0].id };
  } catch (error) {
    console.error("Failed to open class session:", error);
    return { success: false, error: "Failed to open class session" };
  }
}

/**
 * Mark attendance for all members in a class session.
 * Members in presentMemberIds get present=true, others get present=false.
 */
export async function markAttendance(
  classSessionId: string,
  presentMemberIds: string[],
  allMemberIds: string[]
) {
  try {
    const presentSet = new Set(presentMemberIds);

    for (const memberId of allMemberIds) {
      const isPresent = presentSet.has(memberId);

      await db
        .insert(schema.attendance)
        .values({
          memberId,
          classSessionId,
          present: isPresent,
        })
        .onConflictDoUpdate({
          target: [schema.attendance.memberId, schema.attendance.classSessionId],
          set: { present: isPresent },
        });
    }

    revalidatePath("/dashboard/attendance");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

/**
 * Get class sessions for a specific date (server action wrapper).
 */
export async function getSessionsForDateAction(date: string) {
  try {
    const sessions = await getClassSessionsForDate(date);
    return { success: true, sessions };
  } catch (error) {
    console.error("Failed to get sessions for date:", error);
    return { success: false, sessions: [], error: "Failed to fetch sessions" };
  }
}

/**
 * Get enrolled members and existing attendance for a session.
 */
export async function getSessionDetailsAction(
  sessionId: string,
  sportId: string
) {
  try {
    // Get all active members enrolled in this sport
    const allMembers = await getAllMembers({
      sportId,
      isActive: true,
    });

    const members = allMembers.map((m) => ({
      id: m.id,
      fullName: m.fullName,
    }));

    // Get existing attendance records for this session
    const existingAttendance = await getAttendanceForSession(sessionId);

    return { success: true, members, existingAttendance };
  } catch (error) {
    console.error("Failed to get session details:", error);
    return {
      success: false,
      members: [],
      existingAttendance: [],
      error: "Failed to fetch session details",
    };
  }
}
