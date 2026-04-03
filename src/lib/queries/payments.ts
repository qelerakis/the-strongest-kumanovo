import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sum, lte } from "drizzle-orm";
import { getMonthsBetween } from "@/lib/utils";

/**
 * Get all payments for a specific member, ordered by payment date descending.
 */
export async function getPaymentsForMember(memberId: string) {
  return db
    .select({
      id: schema.payments.id,
      memberId: schema.payments.memberId,
      amountMkd: schema.payments.amountMkd,
      paymentDate: schema.payments.paymentDate,
      monthFor: schema.payments.monthFor,
      notes: schema.payments.notes,
      createdAt: schema.payments.createdAt,
    })
    .from(schema.payments)
    .where(eq(schema.payments.memberId, memberId))
    .orderBy(desc(schema.payments.paymentDate));
}

/**
 * Get a payment summary for all members for a given month (YYYY-MM).
 * Returns each member's name, tier price, total paid that month, and
 * cumulative balance from join date through the selected month.
 *
 * Cumulative balance = totalPaid(all months up to selected) - totalOwed(join to selected).
 * This correctly carries forward overpay credits and prior debts.
 */
export async function getPaymentsSummary(month: string) {
  // Get all active members with their tier price and join date
  const members = await db
    .select({
      id: schema.members.id,
      fullName: schema.members.fullName,
      tierName: schema.membershipTiers.name,
      tierPrice: schema.membershipTiers.monthlyPriceMkd,
      joinDate: schema.members.joinDate,
    })
    .from(schema.members)
    .innerJoin(
      schema.membershipTiers,
      eq(schema.members.membershipTierId, schema.membershipTiers.id)
    )
    .where(eq(schema.members.isActive, true))
    .orderBy(schema.members.fullName);

  // Get sum of payments per member for the selected month only
  const paymentsForMonth = await db
    .select({
      memberId: schema.payments.memberId,
      totalPaid: sum(schema.payments.amountMkd),
    })
    .from(schema.payments)
    .where(eq(schema.payments.monthFor, month))
    .groupBy(schema.payments.memberId);

  const paidThisMonthMap = new Map<string, number>();
  for (const p of paymentsForMonth) {
    paidThisMonthMap.set(p.memberId, Number(p.totalPaid ?? 0));
  }

  // Get cumulative sum of payments per member up to and including the selected month
  const cumulativePayments = await db
    .select({
      memberId: schema.payments.memberId,
      totalPaid: sum(schema.payments.amountMkd),
    })
    .from(schema.payments)
    .where(lte(schema.payments.monthFor, month))
    .groupBy(schema.payments.memberId);

  const cumulativePaidMap = new Map<string, number>();
  for (const p of cumulativePayments) {
    cumulativePaidMap.set(p.memberId, Number(p.totalPaid ?? 0));
  }

  // Combine into summary with cumulative balance
  return members.map((member) => {
    const totalPaidThisMonth = paidThisMonthMap.get(member.id) ?? 0;
    const cumulativeTotalPaid = cumulativePaidMap.get(member.id) ?? 0;

    // Calculate months owed from join date through the selected month.
    // A member who joins mid-month (e.g., Oct 15) owes for the full join month.
    const monthsOwed = getMonthsBetween(member.joinDate, month + "-01");
    const cumulativeTotalOwed = monthsOwed.length * member.tierPrice;
    const cumulativeBalance = cumulativeTotalPaid - cumulativeTotalOwed;

    return {
      memberId: member.id,
      fullName: member.fullName,
      tierName: member.tierName,
      tierPrice: member.tierPrice,
      totalPaid: totalPaidThisMonth,
      balance: cumulativeBalance,
    };
  });
}
