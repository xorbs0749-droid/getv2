import { eq, desc, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, tracks, savedTracks, storagePacks, boardPosts, boardComments, emailSubscriptions, trackStats, InsertCategory, InsertTrack, InsertSavedTrack, InsertStoragePack, InsertBoardPost, BoardPost, InsertBoardComment, InsertEmailSubscription, InsertTrackStat } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Category queries
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).orderBy(categories.order);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getCategoriesByType(type: "special" | "place" | "situation" | "weather") {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).where(eq(categories.type, type)).orderBy(categories.order);
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(category);
  return result;
}

export async function updateCategory(id: number, category: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories).set(category).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categories).where(eq(categories.id, id));
}

// Track queries
export async function getAllTracks() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tracks);
}

export async function getTracksByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tracks).where(eq(tracks.categoryId, categoryId));
}

export async function getTrackById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createTrack(track: InsertTrack) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tracks).values(track);
  return result;
}

export async function updateTrack(id: number, track: Partial<InsertTrack>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tracks).set(track).where(eq(tracks.id, id));
}

export async function deleteTrack(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tracks).where(eq(tracks.id, id));
}

// Saved tracks queries
export async function getSavedTracks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: savedTracks.id,
      userId: savedTracks.userId,
      trackId: savedTracks.trackId,
      createdAt: savedTracks.createdAt,
      track: tracks,
    })
    .from(savedTracks)
    .leftJoin(tracks, eq(savedTracks.trackId, tracks.id))
    .where(eq(savedTracks.userId, userId));

  return result;
}

export async function getSavedTracksCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select().from(savedTracks).where(eq(savedTracks.userId, userId));
  return result.length;
}

export async function isTrackSaved(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(savedTracks)
    .where(sql`${savedTracks.userId} = ${userId} AND ${savedTracks.trackId} = ${trackId}`)
    .limit(1);
  return result.length > 0;
}

export async function saveTrack(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(savedTracks).values({ userId, trackId });
}

export async function unsaveTrack(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(savedTracks).where(sql`${savedTracks.userId} = ${userId} AND ${savedTracks.trackId} = ${trackId}`);
}

// Storage pack queries
export async function getStoragePacks() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(storagePacks);
}

export async function getUserStoragePack(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(storagePacks).where(eq(storagePacks.userId, userId)).orderBy(desc(storagePacks.purchasedAt)).limit(1);
  return result[0] ?? null;
}

export async function getStoragePacksByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(storagePacks).where(eq(storagePacks.userId, userId)).orderBy(desc(storagePacks.purchasedAt));
}

export async function getUserStorageLimit(userId: number) {
  const db = await getDb();
  if (!db) return 5;

  const pack = await getUserStoragePack(userId);
  if (!pack) return 5;
  
  if (pack.packType === 'unlimited') return 999999;
  if (pack.packType === 'extra_10') return 15;
  if (pack.packType === 'extra_5') return 10;
  return 5;
}

export async function createStoragePack(pack: InsertStoragePack) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(storagePacks).values(pack);
}

// Board post queries
export async function getAllBoardPosts(category?: string) {
  const db = await getDb();
  if (!db) return [];

  const query = db
    .select({
      id: boardPosts.id,
      title: boardPosts.title,
      content: boardPosts.content,
      authorId: boardPosts.authorId,
      authorName: users.name,
      category: boardPosts.category,
      isPinned: boardPosts.isPinned,
      views: boardPosts.views,
      createdAt: boardPosts.createdAt,
      updatedAt: boardPosts.updatedAt,
    })
    .from(boardPosts)
    .leftJoin(users, eq(boardPosts.authorId, users.id));

  if (category) {
    return await query
      .where(eq(boardPosts.category, category))
      .orderBy(desc(boardPosts.isPinned), desc(boardPosts.createdAt));
  }

  return await query.orderBy(desc(boardPosts.isPinned), desc(boardPosts.createdAt));
}

export async function getBoardPostById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: boardPosts.id,
      title: boardPosts.title,
      content: boardPosts.content,
      authorId: boardPosts.authorId,
      authorName: users.name,
      category: boardPosts.category,
      isPinned: boardPosts.isPinned,
      views: boardPosts.views,
      createdAt: boardPosts.createdAt,
      updatedAt: boardPosts.updatedAt,
    })
    .from(boardPosts)
    .leftJoin(users, eq(boardPosts.authorId, users.id))
    .where(eq(boardPosts.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createBoardPost(post: InsertBoardPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(boardPosts).values(post);
  return result;
}

export async function updateBoardPost(id: number, post: Partial<InsertBoardPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(boardPosts).set(post).where(eq(boardPosts.id, id));
}

export async function deleteBoardPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete comments first
  await db.delete(boardComments).where(eq(boardComments.postId, id));
  // Delete post
  await db.delete(boardPosts).where(eq(boardPosts.id, id));
}

export async function incrementBoardPostViews(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(boardPosts).set({
    views: sql`views + 1`
  }).where(eq(boardPosts.id, id));
}

// Board comment queries
export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: boardComments.id,
      postId: boardComments.postId,
      authorId: boardComments.authorId,
      authorName: users.name,
      content: boardComments.content,
      createdAt: boardComments.createdAt,
      updatedAt: boardComments.updatedAt,
    })
    .from(boardComments)
    .leftJoin(users, eq(boardComments.authorId, users.id))
    .where(eq(boardComments.postId, postId))
    .orderBy(desc(boardComments.createdAt));
}

export async function createBoardComment(comment: InsertBoardComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(boardComments).values(comment);
}

export async function deleteBoardComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(boardComments).where(eq(boardComments.id, id));
}

// Email subscription queries
export async function getEmailSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.userId, userId))
    .limit(1);
  
  return result[0] ?? null;
}

export async function updateEmailSubscription(userId: number, subscribed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getEmailSubscription(userId);
  if (existing) {
    await db.update(emailSubscriptions).set({ subscribed: subscribed ? 1 : 0 }).where(eq(emailSubscriptions.userId, userId));
  } else {
    await db.insert(emailSubscriptions).values({ userId, subscribed: subscribed ? 1 : 0 });
  }
}

export async function getSubscribedUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({ userId: emailSubscriptions.userId })
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.subscribed, 1));
}

// Track statistics queries
export async function getTrackStats(trackId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(trackStats)
    .where(eq(trackStats.trackId, trackId))
    .limit(1);
  
  return result[0] ?? null;
}

export async function incrementTrackPlayCount(trackId: number) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getTrackStats(trackId);
  if (existing) {
    await db.update(trackStats).set({
      playCount: sql`playCount + 1`,
      lastPlayedAt: new Date()
    }).where(eq(trackStats.trackId, trackId));
  } else {
    await db.insert(trackStats).values({
      trackId,
      playCount: 1,
      lastPlayedAt: new Date()
    });
  }
}

export async function getTopTracks(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(trackStats)
    .orderBy(desc(trackStats.playCount))
    .limit(limit);
}

// User queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users);
}

export async function updateUserRole(userId: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) return null;

  await db.update(users).set({ role }).where(eq(users.id, userId));
  return await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return false;

  // Delete user's saved tracks first
  await db.delete(savedTracks).where(eq(savedTracks.userId, userId));
  
  // Delete user's board posts and comments
  await db.delete(boardComments).where(eq(boardComments.authorId, userId));
  await db.delete(boardPosts).where(eq(boardPosts.authorId, userId));
  
  // Delete user
  await db.delete(users).where(eq(users.id, userId));
  
  return true;
}

// User statistics queries
export async function getTotalUserCount() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  return result[0]?.count ?? 0;
}

export async function getActiveUsersLast24Hours() {
  const db = await getDb();
  if (!db) return 0;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(gte(users.lastSignedIn, twentyFourHoursAgo));

  return result[0]?.count ?? 0;
}

// User growth statistics
export async function getUserGrowthStats() {
  const db = await getDb();
  if (!db) return { daily: [], weekly: [], monthly: [] };

  const now = new Date();
  
  // Get daily stats for last 7 days
  const dailyStats = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${date} AND ${users.createdAt} < ${nextDate}`);
    
    dailyStats.push({
      date: date.toISOString().split('T')[0],
      count: result[0]?.count ?? 0,
    });
  }

  // Get weekly stats for last 4 weeks
  const weeklyStats = [];
  for (let i = 3; i >= 0; i--) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (i + 1) * 7);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${startDate} AND ${users.createdAt} < ${endDate}`);
    
    weeklyStats.push({
      week: `Week ${4 - i}`,
      startDate: startDate.toISOString().split('T')[0],
      count: result[0]?.count ?? 0,
    });
  }

  // Get monthly stats for last 6 months
  const monthlyStats = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${date} AND ${users.createdAt} < ${nextMonth}`);
    
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    monthlyStats.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      count: result[0]?.count ?? 0,
    });
  }

  return { daily: dailyStats, weekly: weeklyStats, monthly: monthlyStats };
}

// Category play statistics
export async function getCategoryPlayStats() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      totalPlays: sql<number>`COALESCE(SUM(${trackStats.playCount}), 0)`,
      trackCount: sql<number>`COUNT(DISTINCT ${tracks.id})`,
    })
    .from(categories)
    .leftJoin(tracks, eq(tracks.categoryId, categories.id))
    .leftJoin(trackStats, eq(trackStats.trackId, tracks.id))
    .groupBy(categories.id, categories.name)
    .orderBy(sql`COALESCE(SUM(${trackStats.playCount}), 0) DESC`);

  return result;
}

// Overall statistics summary
export async function getOverallStats() {
  const db = await getDb();
  if (!db) return {
    totalUsers: 0,
    totalTracks: 0,
    totalCategories: 0,
    totalPlays: 0,
    activeUsers24h: 0,
    activeUsers7d: 0,
  };

  const totalUsersResult = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const totalTracksResult = await db.select({ count: sql<number>`COUNT(*)` }).from(tracks);
  const totalCategoriesResult = await db.select({ count: sql<number>`COUNT(*)` }).from(categories);
  const totalPlaysResult = await db.select({ count: sql<number>`COALESCE(SUM(playCount), 0)` }).from(trackStats);
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const activeUsers24hResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(gte(users.lastSignedIn, twentyFourHoursAgo));
  
  const activeUsers7dResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(gte(users.lastSignedIn, sevenDaysAgo));

  return {
    totalUsers: Number(totalUsersResult[0]?.count ?? 0),
    totalTracks: Number(totalTracksResult[0]?.count ?? 0),
    totalCategories: Number(totalCategoriesResult[0]?.count ?? 0),
    totalPlays: Number(totalPlaysResult[0]?.count ?? 0),
    activeUsers24h: Number(activeUsers24hResult[0]?.count ?? 0),
    activeUsers7d: Number(activeUsers7dResult[0]?.count ?? 0),
  };
}
