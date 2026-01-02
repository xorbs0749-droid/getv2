import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { getCurrentWeather, getWeatherCategory } from "./weather";
import { createCheckoutSession } from "./stripe";
import { STORAGE_PACKS, StoragePackType } from "./products";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { generateTitle, generateArtist } from "./titleGenerator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  categories: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    
    getByType: publicProcedure
      .input(z.object({
        type: z.enum(["special", "place", "situation", "weather"]),
      }))
      .query(async ({ input }) => {
        return await db.getCategoriesByType(input.type);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        type: z.enum(["special", "place", "situation", "weather"]),
        description: z.string().optional(),
        icon: z.string().optional(),
        imageUrl: z.string().optional(),
        gradientFrom: z.string(),
        gradientTo: z.string(),
        order: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        return await db.createCategory(input);
      }),
  }),

  tracks: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllTracks();
    }),
    
    getByCategory: publicProcedure
      .input(z.object({
        categoryId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getTracksByCategory(input.categoryId);
      }),
    
    getById: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const track = await db.getTrackById(input.id);
        if (!track) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
        }
        return track;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        artist: z.string().optional(),
        audioUrl: z.string(),
        fileKey: z.string().optional(),
        fileSize: z.number().optional(),
        categoryId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        return await db.createTrack({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),
  }),

  saved: router({
    getMySaved: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavedTracks(ctx.user.id);
    }),
    
    getMyLimit: protectedProcedure.query(async ({ ctx }) => {
      const limit = await db.getUserStorageLimit(ctx.user.id);
      const count = await db.getSavedTracksCount(ctx.user.id);
      return {
        limit,
        count,
        canSaveMore: count < limit,
      };
    }),
    
    isSaved: protectedProcedure
      .input(z.object({
        trackId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        return await db.isTrackSaved(ctx.user.id, input.trackId);
      }),
    
    save: protectedProcedure
      .input(z.object({
        trackId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if already saved
        const isSaved = await db.isTrackSaved(ctx.user.id, input.trackId);
        if (isSaved) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Track already saved" });
        }
        
        // Check storage limit
        const limit = await db.getUserStorageLimit(ctx.user.id);
        const count = await db.getSavedTracksCount(ctx.user.id);
        
        if (count >= limit) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Storage limit reached. Please purchase additional storage." 
          });
        }
        
        return await db.saveTrack(ctx.user.id, input.trackId);
      }),
    
    unsave: protectedProcedure
      .input(z.object({
        trackId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.unsaveTrack(ctx.user.id, input.trackId);
        return { success: true };
      }),
  }),

  storagePacks: router({
    getMyPacks: protectedProcedure.query(async ({ ctx }) => {
      return await db.getStoragePacksByUser(ctx.user.id);
    }),
    
    createCheckout: protectedProcedure
      .input(z.object({
        packType: z.enum(["extra_5", "extra_10", "unlimited"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        
        const session = await createCheckoutSession(
          input.packType as StoragePackType,
          ctx.user.id,
          ctx.user.email || "",
          ctx.user.name || "User",
          origin
        );
        
        return {
          checkoutUrl: session.url,
        };
      }),
  }),

  weather: router({
    getCurrent: publicProcedure
      .input(z.object({
        lat: z.number(),
        lon: z.number(),
      }))
      .query(async ({ input }) => {
        const weather = await getCurrentWeather(input.lat, input.lon);
        const categorySlug = getWeatherCategory(weather.main);
        
        // Find matching category
        const categories = await db.getCategoriesByType("weather");
        const matchedCategory = categories.find(c => c.slug === categorySlug);
        
        return {
          weather,
          recommendedCategory: matchedCategory,
        };
      }),
  }),

  users: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await db.getAllUsers();
    }),
    
    updateRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["admin", "user"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        
        // Prevent self-demotion
        if (input.userId === ctx.user.id && input.role === 'user') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '자기 자신의 관리자 권한을 해제할 수 없습니다.' });
        }
        
        return await db.updateUserRole(input.userId, input.role);
      }),
    
    delete: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        
        // Prevent self-deletion
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '자기 자신을 삭제할 수 없습니다.' });
        }
        
        return await db.deleteUser(input.userId);
      }),
  }),

  admin: router({
    // Track management
    uploadTrack: protectedProcedure
      .input(z.object({
        title: z.string(),
        artist: z.string().optional(),
        categoryId: z.number(),
        audioFile: z.object({
          data: z.string(), // base64
          mimeType: z.string(),
          size: z.number(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(input.audioFile.data, "base64");
        
        // Upload to S3
        const fileKey = `music/${ctx.user.id}/${nanoid()}.mp3`;
        const { url } = await storagePut(fileKey, buffer, input.audioFile.mimeType);

        // Create track record
        await db.createTrack({
          title: input.title,
          artist: input.artist,
          categoryId: input.categoryId,
          audioUrl: url,
          fileKey,
          fileSize: input.audioFile.size,
          uploadedBy: ctx.user.id,
        });

        return { success: true, url };
      }),

    uploadMultipleTracks: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        audioFiles: z.array(z.object({
          fileName: z.string(),
          data: z.string(), // base64
          mimeType: z.string(),
          size: z.number(),
        })),
        autoGenerateTitles: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        // Get category info for title generation
        const category = await db.getCategoryById(input.categoryId);
        if (!category) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
        }

        const uploadedTracks = [];

        for (let i = 0; i < input.audioFiles.length; i++) {
          const audioFile = input.audioFiles[i];
          
          // Generate title and artist if enabled
          let title = input.autoGenerateTitles 
            ? generateTitle(category.name, i)
            : audioFile.fileName.replace(/\.[^/.]+$/, "");
          
          const artist = generateArtist(audioFile.fileName);

          // Convert base64 to buffer
          const buffer = Buffer.from(audioFile.data, "base64");
          
          // Upload to S3
          const fileKey = `music/${ctx.user.id}/${nanoid()}.mp3`;
          const { url } = await storagePut(fileKey, buffer, audioFile.mimeType);

          // Create track record
          await db.createTrack({
            title,
            artist,
            categoryId: input.categoryId,
            audioUrl: url,
            fileKey,
            fileSize: audioFile.size,
            uploadedBy: ctx.user.id,
          });

          uploadedTracks.push({
            title,
            artist,
            url,
          });
        }

        return { 
          success: true, 
          uploadedCount: uploadedTracks.length,
          tracks: uploadedTracks,
        };
      }),

    updateTrack: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        artist: z.string().optional(),
        categoryId: z.number().optional(),
        audioUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const { id, ...updateData } = input;
        await db.updateTrack(id, updateData);
        return { success: true };
      }),

    deleteTrack: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        await db.deleteTrack(input.id);
        return { success: true };
      }),

    // Category management
    createCategory: protectedProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        type: z.enum(["special", "place", "situation", "weather"]),
        description: z.string().optional(),
        icon: z.string().optional(),
        imageUrl: z.string().optional(),
        gradientFrom: z.string(),
        gradientTo: z.string(),
        order: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        await db.createCategory(input);
        return { success: true };
      }),

    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        type: z.enum(["special", "place", "situation", "weather"]).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        imageUrl: z.string().optional(),
        gradientFrom: z.string().optional(),
        gradientTo: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const { id, ...updateData } = input;
        await db.updateCategory(id, updateData);
        return { success: true };
      }),

    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        try {
          await db.deleteCategory(input.id);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: error.message || "Failed to delete category" 
          });
        }
      }),
  }),

  comments: router({
    getByPostId: publicProcedure
      .input(z.object({
        postId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getCommentsByPostId(input.postId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createBoardComment({
          postId: input.postId,
          authorId: ctx.user.id,
          content: input.content,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const comments = await db.getCommentsByPostId(input.id);
        const comment = comments.find(c => c.id === input.id);
        
        if (!comment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
        }
        
        if (comment.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own comments" });
        }
        
        await db.deleteBoardComment(input.id);
        return { success: true };
      }),
  }),

  stats: router({
    getTopTracks: publicProcedure.query(async () => {
      return await db.getTopTracks(10);
    }),
    
    getTrackStats: publicProcedure
      .input(z.object({
        trackId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getTrackStats(input.trackId);
      }),
    
    recordPlay: publicProcedure
      .input(z.object({
        trackId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.incrementTrackPlayCount(input.trackId);
        return { success: true };
      }),
    
    getCounters: publicProcedure.query(async () => {
      const totalUsers = await db.getTotalUserCount();
      const activeUsers24h = await db.getActiveUsersLast24Hours();
      return {
        totalUsers,
        activeUsers24h,
      };
    }),
    
    getUserGrowth: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await db.getUserGrowthStats();
    }),
    
    getCategoryStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await db.getCategoryPlayStats();
    }),
    
    getOverallStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await db.getOverallStats();
    }),
  }),

  email: router({
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      return await db.getEmailSubscription(ctx.user.id);
    }),
    
    subscribe: protectedProcedure
      .input(z.object({
        subscribed: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateEmailSubscription(ctx.user.id, input.subscribed);
        return { success: true };
      }),
  }),

  board: router({
    getAll: publicProcedure
      .input(z.object({
        category: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllBoardPosts(input?.category);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await db.getBoardPostById(input.id);
        if (post) {
          await db.incrementBoardPostViews(input.id);
        }
        return post;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        category: z.string().default("general"),
        isPinned: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // isPinned를 사용하려면 관리자여야 함
        if (input.isPinned && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can pin posts" });
        }

        await db.createBoardPost({
          title: input.title,
          content: input.content,
          category: input.category,
          authorId: ctx.user.id,
          isPinned: input.isPinned || 0,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        isPinned: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 게시글 조회
        const post = await db.getBoardPostById(input.id);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }

        // 권한 체크: 작성자 본인 또는 관리자만 수정 가능
        if (post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own posts" });
        }

        // isPinned를 사용하려면 관리자여야 함
        if (input.isPinned !== undefined && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can pin posts" });
        }

        const { id, isPinned, ...updateData } = input;
        await db.updateBoardPost(id, {
          ...updateData,
          ...(isPinned !== undefined ? { isPinned: isPinned ? 1 : 0 } : {}),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // 게시글 조회
        const post = await db.getBoardPostById(input.id);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }

        // 권한 체크: 작성자 본인 또는 관리자만 삭제 가능
        if (post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own posts" });
        }

        await db.deleteBoardPost(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
