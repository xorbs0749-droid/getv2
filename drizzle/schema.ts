import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

/**
 * Auth.js 필수 테이블들
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const accounts = pgTable("accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: integer("userId").notNull(),
  expires: timestamp("expires").notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertVerificationToken = typeof verificationTokens.$inferInsert;

/**
 * Categories table for organizing music by place, situation, weather, and genre
 */
export const categoryTypeEnum = pgEnum("category_type", ["special", "place", "situation", "weather"]);

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
  type: categoryTypeEnum("type").notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // lucide-react icon name
  imageUrl: varchar("imageUrl", { length: 255 }), // AI generated image path
  gradientFrom: varchar("gradientFrom", { length: 7 }), // hex color
  gradientTo: varchar("gradientTo", { length: 7 }), // hex color
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Music tracks table with S3 streaming URLs
 */
export const tracks = pgTable("tracks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 200 }).notNull(),
  artist: varchar("artist", { length: 200 }),
  audioUrl: varchar("audioUrl", { length: 500 }).notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 500 }), // S3 file key
  fileSize: integer("fileSize"), // File size in bytes
  categoryId: integer("categoryId").notNull(),
  uploadedBy: integer("uploadedBy"), // User ID who uploaded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * Saved tracks table for user favorites
 */
export const savedTracks = pgTable("savedTracks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  trackId: integer("trackId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedTrack = typeof savedTracks.$inferSelect;
export type InsertSavedTrack = typeof savedTracks.$inferInsert;

/**
 * Storage packs table for tracking user purchases
 */
export const storagePacks = pgTable("storagePacks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  packType: varchar("packType", { length: 50 }).notNull(), // extra_5, extra_10, unlimited
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type StoragePack = typeof storagePacks.$inferSelect;
export type InsertStoragePack = typeof storagePacks.$inferInsert;

/**
 * Board posts table for community forum
 */
export const boardPosts = pgTable("boardPosts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("authorId").notNull(),
  category: varchar("category", { length: 50 }).default("general").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BoardPost = typeof boardPosts.$inferSelect;
export type InsertBoardPost = typeof boardPosts.$inferInsert;

/**
 * Board comments table for post discussions
 */
export const boardComments = pgTable("boardComments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("postId").notNull(),
  authorId: integer("authorId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BoardComment = typeof boardComments.$inferSelect;
export type InsertBoardComment = typeof boardComments.$inferInsert;

/**
 * Email subscriptions table for notification preferences
 */
export const emailSubscriptions = pgTable("emailSubscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().unique(),
  subscribed: boolean("subscribed").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type InsertEmailSubscription = typeof emailSubscriptions.$inferInsert;

/**
 * Track statistics table for play counts and analytics
 */
export const trackStats = pgTable("trackStats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  trackId: integer("trackId").notNull().unique(),
  playCount: integer("playCount").default(0).notNull(),
  lastPlayedAt: timestamp("lastPlayedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TrackStat = typeof trackStats.$inferSelect;
export type InsertTrackStat = typeof trackStats.$inferInsert;
