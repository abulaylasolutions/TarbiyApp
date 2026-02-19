import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  photoUrl: text("photo_url"),
  personalInviteCode: text("personal_invite_code").unique(),
  pairedCogenitore: text("paired_cogenitore"),
  pairedCogenitori: text("paired_cogenitori"),
  isProfileComplete: boolean("is_profile_complete").default(false),
  isPremium: boolean("is_premium").default(false),
  preferredLanguage: text("preferred_language").default("it"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const children = pgTable("children", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender"),
  photoUri: text("photo_uri"),
  coParentName: text("co_parent_name"),
  cogenitori: text("cogenitori"),
  cardColor: text("card_color"),
  salahEnabled: boolean("salah_enabled").default(true),
  fastingEnabled: boolean("fasting_enabled").default(true),
  arabicLearnedLetters: text("arabic_learned_letters"),
  hasHarakat: boolean("has_harakat").default(false),
  canReadArabic: boolean("can_read_arabic").default(false),
  canWriteArabic: boolean("can_write_arabic").default(false),
  akhlaqAdabChecked: text("akhlaq_adab_checked"),
  trackQuranToday: boolean("track_quran_today").default(true),
  displayOrder: text("display_order"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  color: text("color").notNull(),
  rotation: text("rotation").notNull(),
  author: text("author").notNull(),
  tags: text("tags"),
  archived: boolean("archived").default(false),
  displayOrder: text("display_order"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  noteId: text("note_id").notNull(),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pendingChanges = pgTable("pending_changes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  targetUserId: text("target_user_id").notNull(),
  childId: text("child_id"),
  action: text("action").notNull(),
  status: text("status").notNull().default("pending"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customTasks = pgTable("custom_tasks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  childId: text("child_id").notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull().default("daily"),
  time: text("time"),
  endTime: text("end_time"),
  days: text("days"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskCompletions = pgTable("task_completions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  taskId: text("task_id").notNull(),
  childId: text("child_id").notNull(),
  date: text("date").notNull(),
  completed: boolean("completed").default(false),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prayerLogs = pgTable("prayer_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  childId: text("child_id").notNull(),
  date: text("date").notNull(),
  fajr: boolean("fajr").default(false),
  dhuhr: boolean("dhuhr").default(false),
  asr: boolean("asr").default(false),
  maghrib: boolean("maghrib").default(false),
  isha: boolean("isha").default(false),
  fajrNote: text("fajr_note"),
  dhuhrNote: text("dhuhr_note"),
  asrNote: text("asr_note"),
  maghribNote: text("maghrib_note"),
  ishaNote: text("isha_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fastingLogs = pgTable("fasting_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  childId: text("child_id").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("no"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quranLogs = pgTable("quran_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  childId: text("child_id").notNull(),
  surahNumber: text("surah_number").notNull(),
  status: text("status").notNull().default("not_started"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quranDailyLogs = pgTable("quran_daily_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  childId: text("child_id").notNull(),
  date: text("date").notNull(),
  completed: boolean("completed").default(false),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  childId: text("child_id").notNull(),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  category: text("category"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().min(1),
  gender: z.string().min(1),
  photoUrl: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Child = typeof children.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type PendingChange = typeof pendingChanges.$inferSelect;
export type CustomTask = typeof customTasks.$inferSelect;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type PrayerLog = typeof prayerLogs.$inferSelect;
export type FastingLog = typeof fastingLogs.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type QuranLog = typeof quranLogs.$inferSelect;
export type QuranDailyLog = typeof quranDailyLogs.$inferSelect;
