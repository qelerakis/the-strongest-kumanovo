import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Get all membership tiers with their pricing.
 */
export async function getMembershipTiers() {
  return db
    .select({
      id: schema.membershipTiers.id,
      name: schema.membershipTiers.name,
      nameKey: schema.membershipTiers.nameKey,
      sportsAllowed: schema.membershipTiers.sportsAllowed,
      monthlyPriceMkd: schema.membershipTiers.monthlyPriceMkd,
      isActive: schema.membershipTiers.isActive,
      updatedAt: schema.membershipTiers.updatedAt,
    })
    .from(schema.membershipTiers)
    .orderBy(schema.membershipTiers.monthlyPriceMkd);
}

/**
 * Get all sports.
 */
export async function getAllSports() {
  return db
    .select({
      id: schema.sports.id,
      name: schema.sports.name,
      nameKey: schema.sports.nameKey,
      color: schema.sports.color,
    })
    .from(schema.sports)
    .orderBy(schema.sports.name);
}
