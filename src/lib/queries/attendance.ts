import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, gte, like, count, desc } from "drizzle-orm";

/**
 * Get all class sessions for a given date.
 * If sessions don't exist yet for that date, auto-create them from the
 * recurring schedule based on the day of the week.
 */
export async function getClassSessionsForDate(date: string) {
  // Determine the day of week from the date
  const d = new Date(date + "T00:00:00");
  const dayOfWeek = d.getDay(); // 0=Sunday

  // Check if sessions already exist for this date
  const existing = await db
    .select({
      id: schema.classSessions.id,
      scheduleId: schema.classSessions.scheduleId,
      date: schema.classSessions.date,
      notes: schema.classSessions.notes,
      startTime: schema.schedule.startTime,
      endTime: schema.schedule.endTime,
      sportId: schema.schedule.sportId,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.classSessions)
    .innerJoin(
      schema.schedule,
      eq(schema.classSessions.scheduleId, schema.schedule.id)
    )
    .innerJoin(schema.sports, eq(schema.schedule.sportId, schema.sports.id))
    .where(eq(schema.classSessions.date, date))
    .orderBy(schema.schedule.startTime);

  if (existing.length > 0) {
    return existing;
  }

  // Auto-create sessions from the recurring schedule for this day
  const scheduleSlots = await db
    .select()
    .from(schema.schedule)
    .where(
      and(
        eq(schema.schedule.dayOfWeek, dayOfWeek),
        eq(schema.schedule.isActive, true)
      )
    )
    .orderBy(schema.schedule.startTime);

  if (scheduleSlots.length === 0) {
    return [];
  }

  // Insert new class sessions for each schedule slot
  const insertValues = scheduleSlots.map((slot) => ({
    scheduleId: slot.id,
    date,
  }));

  await db.insert(schema.classSessions).values(insertValues);

  // Re-fetch the newly created sessions with joined data
  return db
    .select({
      id: schema.classSessions.id,
      scheduleId: schema.classSessions.scheduleId,
      date: schema.classSessions.date,
      notes: schema.classSessions.notes,
      startTime: schema.schedule.startTime,
      endTime: schema.schedule.endTime,
      sportId: schema.schedule.sportId,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.classSessions)
    .innerJoin(
      schema.schedule,
      eq(schema.classSessions.scheduleId, schema.schedule.id)
    )
    .innerJoin(schema.sports, eq(schema.schedule.sportId, schema.sports.id))
    .where(eq(schema.classSessions.date, date))
    .orderBy(schema.schedule.startTime);
}

/**
 * Get all attendance records for a specific class session,
 * joined with member names.
 */
export async function getAttendanceForSession(sessionId: string) {
  return db
    .select({
      id: schema.attendance.id,
      memberId: schema.attendance.memberId,
      classSessionId: schema.attendance.classSessionId,
      present: schema.attendance.present,
      memberName: schema.members.fullName,
    })
    .from(schema.attendance)
    .innerJoin(
      schema.members,
      eq(schema.attendance.memberId, schema.members.id)
    )
    .where(eq(schema.attendance.classSessionId, sessionId))
    .orderBy(schema.members.fullName);
}

/**
 * Get attendance history for a specific member.
 * Defaults to the last 3 months.
 */
export async function getMemberAttendanceHistory(
  memberId: string,
  months: number = 3
) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  return db
    .select({
      id: schema.attendance.id,
      present: schema.attendance.present,
      sessionDate: schema.classSessions.date,
      startTime: schema.schedule.startTime,
      endTime: schema.schedule.endTime,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.attendance)
    .innerJoin(
      schema.classSessions,
      eq(schema.attendance.classSessionId, schema.classSessions.id)
    )
    .innerJoin(
      schema.schedule,
      eq(schema.classSessions.scheduleId, schema.schedule.id)
    )
    .innerJoin(schema.sports, eq(schema.schedule.sportId, schema.sports.id))
    .where(
      and(
        eq(schema.attendance.memberId, memberId),
        eq(schema.attendance.present, true),
        gte(schema.classSessions.date, cutoffStr)
      )
    )
    .orderBy(desc(schema.classSessions.date));
}

/**
 * Count the number of sessions a member attended in a given month (YYYY-MM).
 */
export async function getMonthlyAttendanceCount(
  memberId: string,
  month: string
) {
  // Use LIKE 'YYYY-MM%' to match all dates within the month
  const result = await db
    .select({
      count: count(),
    })
    .from(schema.attendance)
    .innerJoin(
      schema.classSessions,
      eq(schema.attendance.classSessionId, schema.classSessions.id)
    )
    .where(
      and(
        eq(schema.attendance.memberId, memberId),
        eq(schema.attendance.present, true),
        like(schema.classSessions.date, `${month}%`)
      )
    );

  return result[0]?.count ?? 0;
}
