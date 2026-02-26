import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

// ============================================
// USERS TABLE (Authentication)
// ============================================
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "member"] })
    .notNull()
    .default("member"),
  memberId: text("member_id").references(() => members.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================
// MEMBERS TABLE (Profile Data)
// ============================================
export const members = sqliteTable("members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  dateOfBirth: text("date_of_birth"),
  emergencyContact: text("emergency_contact"),
  membershipTierId: text("membership_tier_id")
    .references(() => membershipTiers.id)
    .notNull(),
  beltRank: text("belt_rank", {
    enum: ["white", "blue", "purple", "brown", "black"],
  }).default("white"),
  joinDate: text("join_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================
// SPORTS TABLE
// ============================================
export const sports = sqliteTable("sports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  nameKey: text("name_key").notNull().unique(),
  color: text("color"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================
// MEMBERSHIP TIERS TABLE
// ============================================
export const membershipTiers = sqliteTable("membership_tiers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  nameKey: text("name_key").notNull(),
  sportsAllowed: integer("sports_allowed").notNull(),
  monthlyPriceMkd: integer("monthly_price_mkd").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================
// MEMBER SPORTS (Junction Table)
// ============================================
export const memberSports = sqliteTable(
  "member_sports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    sportId: text("sport_id")
      .notNull()
      .references(() => sports.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.memberId, table.sportId)]
);

// ============================================
// SCHEDULE TABLE (Recurring Class Slots)
// ============================================
export const schedule = sqliteTable("schedule", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  sportId: text("sport_id")
    .notNull()
    .references(() => sports.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================
// CLASS SESSIONS TABLE (Actual instances of scheduled classes)
// ============================================
export const classSessions = sqliteTable(
  "class_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id),
    date: text("date").notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => [unique().on(table.scheduleId, table.date)]
);

// ============================================
// ATTENDANCE TABLE
// ============================================
export const attendance = sqliteTable(
  "attendance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    classSessionId: text("class_session_id")
      .notNull()
      .references(() => classSessions.id, { onDelete: "cascade" }),
    present: integer("present", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => [unique().on(table.memberId, table.classSessionId)]
);

// ============================================
// PAYMENTS TABLE
// ============================================
export const payments = sqliteTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  amountMkd: integer("amount_mkd").notNull(),
  paymentDate: text("payment_date").notNull(),
  monthFor: text("month_for").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});
