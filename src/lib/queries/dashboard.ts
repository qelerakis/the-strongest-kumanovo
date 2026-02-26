import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, like, count, sum, sql, desc } from "drizzle-orm";
import { getCurrentMonth } from "@/lib/utils";

/**
 * Get aggregate dashboard statistics.
 * Returns total members, active members, monthly attendance rate, and monthly revenue.
 */
export async function getDashboardStats() {
  const currentMonth = getCurrentMonth();

  // Total members
  const totalResult = await db
    .select({ count: count() })
    .from(schema.members);
  const totalMembers = totalResult[0]?.count ?? 0;

  // Active members
  const activeResult = await db
    .select({ count: count() })
    .from(schema.members)
    .where(eq(schema.members.isActive, true));
  const activeMembers = activeResult[0]?.count ?? 0;

  // Monthly attendance: count distinct members who attended at least once this month
  const attendedResult = await db
    .select({
      count: sql<number>`count(distinct ${schema.attendance.memberId})`,
    })
    .from(schema.attendance)
    .innerJoin(
      schema.classSessions,
      eq(schema.attendance.classSessionId, schema.classSessions.id)
    )
    .where(
      and(
        eq(schema.attendance.present, true),
        like(schema.classSessions.date, `${currentMonth}%`)
      )
    );
  const membersAttended = Number(attendedResult[0]?.count ?? 0);

  // Attendance rate = members who attended / active members * 100
  const monthlyAttendanceRate =
    activeMembers > 0
      ? Math.round((membersAttended / activeMembers) * 100)
      : 0;

  // Monthly revenue: sum of payments for current month
  const revenueResult = await db
    .select({
      total: sum(schema.payments.amountMkd),
    })
    .from(schema.payments)
    .where(eq(schema.payments.monthFor, currentMonth));
  const monthlyRevenue = Number(revenueResult[0]?.total ?? 0);

  return {
    totalMembers,
    activeMembers,
    monthlyAttendanceRate,
    monthlyRevenue,
  };
}

/**
 * Get members flagged for low attendance (<3 sessions) in a given month.
 * Returns member name and attendance count.
 */
export async function getFlaggedMembers(month: string) {
  // Get all active members
  const activeMembers = await db
    .select({
      id: schema.members.id,
      fullName: schema.members.fullName,
    })
    .from(schema.members)
    .where(eq(schema.members.isActive, true))
    .orderBy(schema.members.fullName);

  // Get attendance counts for the month, grouped by member
  const attendanceCounts = await db
    .select({
      memberId: schema.attendance.memberId,
      count: count(),
    })
    .from(schema.attendance)
    .innerJoin(
      schema.classSessions,
      eq(schema.attendance.classSessionId, schema.classSessions.id)
    )
    .where(
      and(
        eq(schema.attendance.present, true),
        like(schema.classSessions.date, `${month}%`)
      )
    )
    .groupBy(schema.attendance.memberId);

  // Build lookup map
  const countMap = new Map<string, number>();
  for (const row of attendanceCounts) {
    countMap.set(row.memberId, row.count);
  }

  // Filter to members with fewer than 3 attendances
  return activeMembers
    .map((member) => ({
      memberId: member.id,
      fullName: member.fullName,
      attendanceCount: countMap.get(member.id) ?? 0,
    }))
    .filter((m) => m.attendanceCount < 3);
}

/**
 * Get the most recent payments with member names, ordered by createdAt desc.
 */
export async function getRecentPayments(limit: number = 5) {
  const results = await db
    .select({
      id: schema.payments.id,
      amountMkd: schema.payments.amountMkd,
      monthFor: schema.payments.monthFor,
      paymentDate: schema.payments.paymentDate,
      createdAt: schema.payments.createdAt,
      memberName: schema.members.fullName,
      memberId: schema.payments.memberId,
    })
    .from(schema.payments)
    .innerJoin(
      schema.members,
      eq(schema.payments.memberId, schema.members.id)
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(limit);

  return results;
}
