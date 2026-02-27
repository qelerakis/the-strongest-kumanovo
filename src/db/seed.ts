import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hashSync } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import * as schema from "./schema";

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Seed sports
  const sportsData = [
    { id: createId(), name: "BJJ", nameKey: "bjj", color: "#DC2626" },
    {
      id: createId(),
      name: "Kickboxing",
      nameKey: "kickboxing",
      color: "#EAB308",
    },
    { id: createId(), name: "MMA", nameKey: "mma", color: "#22C55E" },
  ];

  for (const sport of sportsData) {
    await db.insert(schema.sports).values(sport).onConflictDoNothing();
  }
  console.log("Sports seeded.");

  // Seed membership tiers
  const tiersData = [
    {
      id: createId(),
      name: "Basic",
      nameKey: "basic",
      sportsAllowed: 1,
      monthlyPriceMkd: 1500,
    },
    {
      id: createId(),
      name: "Standard",
      nameKey: "standard",
      sportsAllowed: 2,
      monthlyPriceMkd: 2500,
    },
    {
      id: createId(),
      name: "Premium",
      nameKey: "premium",
      sportsAllowed: -1,
      monthlyPriceMkd: 3500,
    },
  ];

  for (const tier of tiersData) {
    await db.insert(schema.membershipTiers).values(tier).onConflictDoNothing();
  }
  console.log("Membership tiers seeded.");

  // Seed admin user
  const adminPasswordHash = hashSync("admin123", 12);
  await db
    .insert(schema.users)
    .values({
      id: createId(),
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "admin",
      memberId: null,
    })
    .onConflictDoNothing();
  console.log("Admin user seeded (username: admin, password: admin123).");

  // Seed default schedule
  // dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
  const bjj = sportsData[0];
  const kickboxing = sportsData[1];
  const mma = sportsData[2];

  const scheduleData = [
    // Monday
    {
      sportId: bjj.id,
      dayOfWeek: 1,
      startTime: "18:30",
      endTime: null,
    },
    {
      sportId: kickboxing.id,
      dayOfWeek: 1,
      startTime: "19:30",
      endTime: null,
    },
    // Tuesday
    {
      sportId: bjj.id,
      dayOfWeek: 2,
      startTime: "19:00",
      endTime: null,
    },
    {
      sportId: mma.id,
      dayOfWeek: 2,
      startTime: "20:00",
      endTime: null,
    },
    // Wednesday
    {
      sportId: kickboxing.id,
      dayOfWeek: 3,
      startTime: "19:00",
      endTime: null,
    },
    {
      sportId: kickboxing.id,
      dayOfWeek: 3,
      startTime: "20:00",
      endTime: null,
    },
    // Thursday
    {
      sportId: bjj.id,
      dayOfWeek: 4,
      startTime: "19:00",
      endTime: null,
    },
    {
      sportId: mma.id,
      dayOfWeek: 4,
      startTime: "20:00",
      endTime: null,
    },
    // Friday
    {
      sportId: kickboxing.id,
      dayOfWeek: 5,
      startTime: "19:00",
      endTime: null,
    },
    // Saturday
    {
      sportId: bjj.id,
      dayOfWeek: 6,
      startTime: "12:00",
      endTime: null,
    },
    {
      sportId: kickboxing.id,
      dayOfWeek: 6,
      startTime: "13:00",
      endTime: null,
    },
  ];

  for (const slot of scheduleData) {
    await db.insert(schema.schedule).values({
      id: createId(),
      ...slot,
    });
  }
  console.log("Default schedule seeded.");

  console.log("Database seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
