import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sum } from "drizzle-orm";

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
 * Returns each member's name, tier price, total paid that month, and balance.
 */
export async function getPaymentsSummary(month: string) {
  // Get all active members with their tier price
  const members = await db
    .select({
      id: schema.members.id,
      fullName: schema.members.fullName,
      tierName: schema.membershipTiers.name,
      tierPrice: schema.membershipTiers.monthlyPriceMkd,
    })
    .from(schema.members)
    .innerJoin(
      schema.membershipTiers,
      eq(schema.members.membershipTierId, schema.membershipTiers.id)
    )
    .where(eq(schema.members.isActive, true))
    .orderBy(schema.members.fullName);

  // Get sum of payments per member for the given month
  const paymentsForMonth = await db
    .select({
      memberId: schema.payments.memberId,
      totalPaid: sum(schema.payments.amountMkd),
    })
    .from(schema.payments)
    .where(eq(schema.payments.monthFor, month))
    .groupBy(schema.payments.memberId);

  // Build a lookup map of memberId -> totalPaid
  const paidMap = new Map<string, number>();
  for (const p of paymentsForMonth) {
    paidMap.set(p.memberId, Number(p.totalPaid ?? 0));
  }

  // Combine into summary
  return members.map((member) => {
    const totalPaid = paidMap.get(member.id) ?? 0;
    const balance = totalPaid - member.tierPrice;

    return {
      memberId: member.id,
      fullName: member.fullName,
      tierName: member.tierName,
      tierPrice: member.tierPrice,
      totalPaid,
      balance,
    };
  });
}
