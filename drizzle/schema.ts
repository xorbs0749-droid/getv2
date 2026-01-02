import { pgTable, pgEnum, serial, text, timestamp, integer, boolean, varchar } from 'drizzle-orm/pg-core';
import { primaryKey } from 'drizzle-orm/pg-core';

// ENUM
export const categoryType = pgEnum('category_type', ['special', 'place', 'situation', 'weather']);

// Auth.js tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: varchar('email', { length: 320 }).unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').unique().notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// App tables
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: categoryType('type').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tracks = pgTable('tracks', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  artist: varchar('artist', { length: 200 }),
  url: text('url').notNull(),
  duration: integer('duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const savedTracks = pgTable('saved_tracks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  trackId: integer('track_id').references(() => tracks.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const storagePacks = pgTable('storage_packs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  packType: varchar('pack_type', { length: 50 }).notNull(),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
});

export const boardPosts = pgTable('board_posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  category: varchar('category', { length: 50 }),
  isPinned: boolean('is_pinned').default(false).notNull(),
  views: integer('views').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const boardComments = pgTable('board_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => boardPosts.id, { onDelete: 'cascade' }).notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emailSubscriptions = pgTable('email_subscriptions', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 320 }).unique().notNull(),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const trackStats = pgTable('track_stats', {
  id: serial('id').primaryKey(),
  trackId: integer('track_id').references(() => tracks.id, { onDelete: 'cascade' }).notNull(),
  playCount: integer('play_count').default(0).notNull(),
  lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
});

// Types
export type InsertUser = typeof users.$inferInsert;
export type InsertCategory = typeof categories.$inferInsert;
export type InsertTrack = typeof tracks.$inferInsert;
export type InsertSavedTrack = typeof savedTracks.$inferInsert;
export type InsertStoragePack = typeof storagePacks.$inferInsert;
export type InsertBoardPost = typeof boardPosts.$inferInsert;
export type BoardPost = typeof boardPosts.$inferSelect;
export type InsertBoardComment = typeof boardComments.$inferInsert;
export type InsertEmailSubscription = typeof emailSubscriptions.$inferInsert;
export type InsertTrackStat = typeof trackStats.$inferInsert;
