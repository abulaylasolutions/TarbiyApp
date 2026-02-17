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
