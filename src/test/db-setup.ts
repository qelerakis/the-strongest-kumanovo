import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

export type TestDb = LibSQLDatabase<typeof schema>;

export function createTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  return { db, client };
}

/**
 * Raw SQL to create all tables matching the Drizzle schema.
 * Using `:memory:` SQLite so we must create tables manually.
 */
const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS membership_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    name_key TEXT NOT NULL,
    sports_allowed INTEGER NOT NULL,
    monthly_price_mkd INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    date_of_birth TEXT,
    emergency_contact TEXT,
    membership_tier_id TEXT NOT NULL REFERENCES membership_tiers(id),
    belt_rank TEXT DEFAULT 'white',
    join_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at INTEGER,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    member_id TEXT REFERENCES members(id),
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS sports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    name_key TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS member_sports (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    UNIQUE(member_id, sport_id)
  )`,
  `CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY,
    sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS class_sessions (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL REFERENCES schedule(id),
    date TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER,
    UNIQUE(schedule_id, date)
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    class_session_id TEXT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    present INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER,
    UNIQUE(member_id, class_session_id)
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount_mkd INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    month_for TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER
  )`,
];

export async function setupTestDb() {
  const { db, client } = createTestDb();

  // Enable foreign key enforcement (required for CASCADE deletes in SQLite)
  await client.execute("PRAGMA foreign_keys = ON");

  for (const sql of CREATE_TABLES_SQL) {
    await client.execute(sql);
  }

  return { db, client };
}

/**
 * Seed test data and return IDs for use in tests.
 */
export async function seedTestData(db: TestDb) {
  // Insert sports
  const [bjj] = await db
    .insert(schema.sports)
    .values({
      id: "sport_bjj",
      name: "BJJ",
      nameKey: "bjj",
      color: "#DC2626",
    })
    .returning();

  const [kickboxing] = await db
    .insert(schema.sports)
    .values({
      id: "sport_kb",
      name: "Kickboxing",
      nameKey: "kickboxing",
      color: "#EAB308",
    })
    .returning();

  const [wrestling] = await db
    .insert(schema.sports)
    .values({
      id: "sport_wr",
      name: "Wrestling",
      nameKey: "wrestling",
      color: "#2563EB",
    })
    .returning();

  const [mma] = await db
    .insert(schema.sports)
    .values({
      id: "sport_mma",
      name: "MMA",
      nameKey: "mma",
      color: "#16A34A",
    })
    .returning();

  // Insert tiers
  const [basicTier] = await db
    .insert(schema.membershipTiers)
    .values({
      id: "tier_basic",
      name: "Basic",
      nameKey: "basic",
      sportsAllowed: 1,
      monthlyPriceMkd: 1500,
      isActive: true,
    })
    .returning();

  const [standardTier] = await db
    .insert(schema.membershipTiers)
    .values({
      id: "tier_standard",
      name: "Standard",
      nameKey: "standard",
      sportsAllowed: 2,
      monthlyPriceMkd: 2500,
      isActive: true,
    })
    .returning();

  const [premiumTier] = await db
    .insert(schema.membershipTiers)
    .values({
      id: "tier_premium",
      name: "Premium",
      nameKey: "premium",
      sportsAllowed: -1,
      monthlyPriceMkd: 3500,
      isActive: true,
    })
    .returning();

  // Insert members
  const [member1] = await db
    .insert(schema.members)
    .values({
      id: "member_1",
      fullName: "Stefan Petrovic",
      phone: "+389 70 111 111",
      email: "stefan@test.com",
      membershipTierId: "tier_basic",
      beltRank: "white",
      joinDate: "2025-10-01",
      isActive: true,
    })
    .returning();

  const [member2] = await db
    .insert(schema.members)
    .values({
      id: "member_2",
      fullName: "Ana Kostadinova",
      phone: "+389 70 222 222",
      email: "ana@test.com",
      membershipTierId: "tier_standard",
      beltRank: "blue",
      joinDate: "2025-11-01",
      isActive: true,
    })
    .returning();

  const [member3] = await db
    .insert(schema.members)
    .values({
      id: "member_3",
      fullName: "Marko Nikolovski",
      membershipTierId: "tier_premium",
      beltRank: "purple",
      joinDate: "2025-06-01",
      isActive: false,
    })
    .returning();

  // Insert member sports
  await db.insert(schema.memberSports).values([
    { id: "ms_1", memberId: "member_1", sportId: "sport_bjj" },
    { id: "ms_2", memberId: "member_2", sportId: "sport_bjj" },
    { id: "ms_3", memberId: "member_2", sportId: "sport_kb" },
    { id: "ms_4", memberId: "member_3", sportId: "sport_mma" },
  ]);

  // Insert schedule slots
  const [schedSlot1] = await db
    .insert(schema.schedule)
    .values({
      id: "sched_1",
      sportId: "sport_bjj",
      dayOfWeek: 1, // Monday
      startTime: "18:00",
      endTime: "19:30",
      isActive: true,
    })
    .returning();

  const [schedSlot2] = await db
    .insert(schema.schedule)
    .values({
      id: "sched_2",
      sportId: "sport_kb",
      dayOfWeek: 2, // Tuesday
      startTime: "19:00",
      endTime: "20:30",
      isActive: true,
    })
    .returning();

  const [schedSlot3] = await db
    .insert(schema.schedule)
    .values({
      id: "sched_3",
      sportId: "sport_bjj",
      dayOfWeek: 3, // Wednesday
      startTime: "18:00",
      endTime: "19:30",
      isActive: true,
    })
    .returning();

  // Insert a class session for Monday 2026-02-23
  const [session1] = await db
    .insert(schema.classSessions)
    .values({
      id: "session_1",
      scheduleId: "sched_1",
      date: "2026-02-23",
    })
    .returning();

  // Insert attendance records
  await db.insert(schema.attendance).values([
    {
      id: "att_1",
      memberId: "member_1",
      classSessionId: "session_1",
      present: true,
    },
    {
      id: "att_2",
      memberId: "member_2",
      classSessionId: "session_1",
      present: true,
    },
  ]);

  // Insert payments
  await db.insert(schema.payments).values([
    {
      id: "pay_1",
      memberId: "member_1",
      amountMkd: 1500,
      paymentDate: "2026-02-01",
      monthFor: "2026-02",
      notes: "February payment",
    },
    {
      id: "pay_2",
      memberId: "member_1",
      amountMkd: 1500,
      paymentDate: "2026-01-05",
      monthFor: "2026-01",
      notes: null,
    },
    {
      id: "pay_3",
      memberId: "member_2",
      amountMkd: 2500,
      paymentDate: "2026-02-10",
      monthFor: "2026-02",
      notes: null,
    },
  ]);

  // Insert admin user (no memberId)
  await db.insert(schema.users).values({
    id: "user_admin",
    username: "admin",
    passwordHash: "hashed_password",
    role: "admin",
    memberId: null,
  });

  // Insert member user for member_1
  await db.insert(schema.users).values({
    id: "user_member1",
    username: "stefan",
    passwordHash: "hashed_password",
    role: "member",
    memberId: "member_1",
  });

  return {
    sports: { bjj, kickboxing, wrestling, mma },
    tiers: { basicTier, standardTier, premiumTier },
    members: { member1, member2, member3 },
    scheduleSlots: { schedSlot1, schedSlot2, schedSlot3 },
    sessions: { session1 },
  };
}
