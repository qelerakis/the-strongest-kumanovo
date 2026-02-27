import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, like, sum } from "drizzle-orm";
import { getMonthsBetween, getCurrentMonth } from "@/lib/utils";

/**
 * Get all members with their tier and sports, with optional filters.
 */
export async function getAllMembers(filters?: {
  sportId?: string;
  tierId?: string;
  isActive?: boolean;
  search?: string;
}) {
  const conditions = [];

  if (filters?.isActive !== undefined) {
    conditions.push(eq(schema.members.isActive, filters.isActive));
  }

  if (filters?.tierId) {
    conditions.push(eq(schema.members.membershipTierId, filters.tierId));
  }

  if (filters?.search) {
    conditions.push(
      like(schema.members.fullName, `%${filters.search}%`)
    );
  }

  // Base query for members with tier
  let membersResult = await db
    .select({
      id: schema.members.id,
      fullName: schema.members.fullName,
      phone: schema.members.phone,
      email: schema.members.email,
      dateOfBirth: schema.members.dateOfBirth,
      beltRank: schema.members.beltRank,
      joinDate: schema.members.joinDate,
      isActive: schema.members.isActive,
      notes: schema.members.notes,
      membershipTierId: schema.members.membershipTierId,
      tierName: schema.membershipTiers.name,
      tierPrice: schema.membershipTiers.monthlyPriceMkd,
    })
    .from(schema.members)
    .innerJoin(
      schema.membershipTiers,
      eq(schema.members.membershipTierId, schema.membershipTiers.id)
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.members.fullName);

  // If filtering by sport, narrow down by member IDs that belong to that sport
  if (filters?.sportId) {
    const sportMembers = await db
      .select({ memberId: schema.memberSports.memberId })
      .from(schema.memberSports)
      .where(eq(schema.memberSports.sportId, filters.sportId));

    const sportMemberIds = new Set(sportMembers.map((sm) => sm.memberId));
    membersResult = membersResult.filter((m) => sportMemberIds.has(m.id));
  }

  // Fetch sports for all members
  const allMemberSports = await db
    .select({
      memberId: schema.memberSports.memberId,
      sportId: schema.memberSports.sportId,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.memberSports)
    .innerJoin(schema.sports, eq(schema.memberSports.sportId, schema.sports.id));

  const sportsByMember = new Map<
    string,
    { sportId: string; sportName: string; sportColor: string | null }[]
  >();

  for (const ms of allMemberSports) {
    if (!sportsByMember.has(ms.memberId)) {
      sportsByMember.set(ms.memberId, []);
    }
    sportsByMember.get(ms.memberId)!.push({
      sportId: ms.sportId,
      sportName: ms.sportName,
      sportColor: ms.sportColor,
    });
  }

  return membersResult.map((member) => ({
    ...member,
    sports: sportsByMember.get(member.id) ?? [],
  }));
}

/**
 * Get a single member by ID with their tier, sports, and user account info.
 */
export async function getMemberById(id: string) {
  const memberResult = await db
    .select({
      id: schema.members.id,
      fullName: schema.members.fullName,
      phone: schema.members.phone,
      email: schema.members.email,
      dateOfBirth: schema.members.dateOfBirth,
      beltRank: schema.members.beltRank,
      joinDate: schema.members.joinDate,
      isActive: schema.members.isActive,
      notes: schema.members.notes,
      membershipTierId: schema.members.membershipTierId,
      tierName: schema.membershipTiers.name,
      tierPrice: schema.membershipTiers.monthlyPriceMkd,
      sportsAllowed: schema.membershipTiers.sportsAllowed,
    })
    .from(schema.members)
    .innerJoin(
      schema.membershipTiers,
      eq(schema.members.membershipTierId, schema.membershipTiers.id)
    )
    .where(eq(schema.members.id, id))
    .limit(1);

  const member = memberResult[0];
  if (!member) return null;

  // Fetch sports for this member
  const sports = await db
    .select({
      sportId: schema.memberSports.sportId,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.memberSports)
    .innerJoin(schema.sports, eq(schema.memberSports.sportId, schema.sports.id))
    .where(eq(schema.memberSports.memberId, id));

  // Fetch associated user account
  const userResult = await db
    .select({
      userId: schema.users.id,
      username: schema.users.username,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.memberId, id))
    .limit(1);

  return {
    ...member,
    sports,
    user: userResult[0] ?? null,
  };
}

/**
 * Compute a member's balance:
 * totalOwed = number of months from joinDate to now * tier monthly price
 * totalPaid = sum of all payments
 * balance = totalPaid - totalOwed (positive means credit, negative means debt)
 */
export async function getMemberBalance(id: string) {
  // Get member with tier price and join date
  const memberResult = await db
    .select({
      joinDate: schema.members.joinDate,
      tierPrice: schema.membershipTiers.monthlyPriceMkd,
    })
    .from(schema.members)
    .innerJoin(
      schema.membershipTiers,
      eq(schema.members.membershipTierId, schema.membershipTiers.id)
    )
    .where(eq(schema.members.id, id))
    .limit(1);

  const member = memberResult[0];
  if (!member) return null;

  // Calculate months owed from join date to current month
  const currentMonth = getCurrentMonth();
  const months = getMonthsBetween(member.joinDate, currentMonth + "-01");
  const totalOwed = months.length * member.tierPrice;

  // Sum all payments for this member
  const paymentResult = await db
    .select({
      total: sum(schema.payments.amountMkd),
    })
    .from(schema.payments)
    .where(eq(schema.payments.memberId, id));

  const totalPaid = Number(paymentResult[0]?.total ?? 0);
  const balance = totalPaid - totalOwed;

  return {
    totalPaid,
    totalOwed,
    balance,
    isCredit: balance >= 0,
  };
}
