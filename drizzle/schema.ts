import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories table for organizing music by place, situation, weather, and genre
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
  type: mysqlEnum("type", ["special", "place", "situation", "weather"]).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // lucide-react icon name
  imageUrl: varchar("imageUrl", { length: 255 }), // AI generated image path
  gradientFrom: varchar("gradientFrom", { length: 7 }), // hex color
  gradientTo: varchar("gradientTo", { length: 7 }), // hex color
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Music tracks table with S3 streaming URLs
 */
export const tracks = mysqlTable("tracks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  artist: varchar("artist", { length: 200 }),
  audioUrl: varchar("audioUrl", { length: 500 }).notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 500 }), // S3 file key
  fileSize: int("fileSize"), // File size in bytes
  categoryId: int("categoryId").notNull(),
  uploadedBy: int("uploadedBy"), // User ID who uploaded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * Saved tracks table for user favorites
 */
export const savedTracks = mysqlTable("savedTracks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trackId: int("trackId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedTrack = typeof savedTracks.$inferSelect;
export type InsertSavedTrack = typeof savedTracks.$inferInsert;

/**
 * Storage packs table for tracking user purchases
 */
export const storagePacks = mysqlTable("storagePacks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  packType: varchar("packType", { length: 50 }).notNull(), // extra_5, extra_10, unlimited
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type StoragePack = typeof storagePacks.$inferSelect;
export type InsertStoragePack = typeof storagePacks.$inferInsert;

/**
 * Board posts table for community forum
 */
export const boardPosts = mysqlTable("boardPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  category: varchar("category", { length: 50 }).default("general").notNull(),
  isPinned: tinyint("isPinned").default(0).notNull(), // 0 = false, 1 = true
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BoardPost = typeof boardPosts.$inferSelect;
export type InsertBoardPost = typeof boardPosts.$inferInsert;

/**
 * Board comments table for post discussions
 */
export const boardComments = mysqlTable("boardComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BoardComment = typeof boardComments.$inferSelect;
export type InsertBoardComment = typeof boardComments.$inferInsert;

/**
 * Email subscriptions table for notification preferences
 */
export const emailSubscriptions = mysqlTable("emailSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  subscribed: tinyint("subscribed").default(1).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type InsertEmailSubscription = typeof emailSubscriptions.$inferInsert;

/**
 * Track statistics table for play counts and analytics
 */
export const trackStats = mysqlTable("trackStats", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull().unique(),
  playCount: int("playCount").default(0).notNull(),
  lastPlayedAt: timestamp("lastPlayedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrackStat = typeof trackStats.$inferSelect;
export type InsertTrackStat = typeof trackStats.$inferInsert;
