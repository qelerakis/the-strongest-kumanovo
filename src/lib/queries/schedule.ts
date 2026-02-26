import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get all active schedule slots joined with sport name and color,
 * grouped by dayOfWeek, sorted by startTime within each day.
 */
export async function getFullSchedule() {
  const slots = await db
    .select({
      id: schema.schedule.id,
      dayOfWeek: schema.schedule.dayOfWeek,
      startTime: schema.schedule.startTime,
      endTime: schema.schedule.endTime,
      sportId: schema.schedule.sportId,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.schedule)
    .innerJoin(schema.sports, eq(schema.schedule.sportId, schema.sports.id))
    .where(eq(schema.schedule.isActive, true))
    .orderBy(schema.schedule.dayOfWeek, schema.schedule.startTime);

  const grouped: Record<
    number,
    typeof slots
  > = {};

  for (const slot of slots) {
    if (!grouped[slot.dayOfWeek]) {
      grouped[slot.dayOfWeek] = [];
    }
    grouped[slot.dayOfWeek].push(slot);
  }

  return grouped;
}

/**
 * Get schedule for a specific day of the week (0=Sunday, 6=Saturday).
 */
export async function getScheduleForDay(dayOfWeek: number) {
  return db
    .select({
      id: schema.schedule.id,
      dayOfWeek: schema.schedule.dayOfWeek,
      startTime: schema.schedule.startTime,
      endTime: schema.schedule.endTime,
      sportId: schema.schedule.sportId,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.schedule)
    .innerJoin(schema.sports, eq(schema.schedule.sportId, schema.sports.id))
    .where(
      and(
        eq(schema.schedule.dayOfWeek, dayOfWeek),
        eq(schema.schedule.isActive, true)
      )
    )
    .orderBy(schema.schedule.startTime);
}

/**
 * Get a single schedule slot by its ID.
 */
export async function getScheduleById(id: string) {
  const result = await db
    .select({
      id: schema.schedule.id,
      dayOfWeek: schema.schedule.dayOfWeek,
      startTime: schema.schedule.startTime,
      endTime: schema.schedule.endTime,
      isActive: schema.schedule.isActive,
      sportId: schema.schedule.sportId,
      sportName: schema.sports.name,
      sportColor: schema.sports.color,
    })
    .from(schema.schedule)
    .innerJoin(schema.sports, eq(schema.schedule.sportId, schema.sports.id))
    .where(eq(schema.schedule.id, id))
    .limit(1);

  return result[0] ?? null;
}
