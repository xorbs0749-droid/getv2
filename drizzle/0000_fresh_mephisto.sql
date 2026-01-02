CREATE TYPE "public"."category_type" AS ENUM('special', 'place', 'situation', 'weather');--> statement-breakpoint
CREATE TABLE "boardComments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boardComments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"authorId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boardPosts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boardPosts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"authorId" integer NOT NULL,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100),
	"type" "category_type" NOT NULL,
	"description" text,
	"icon" varchar(50),
	"imageUrl" varchar(255),
	"gradientFrom" varchar(7),
	"gradientTo" varchar(7),
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "emailSubscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "emailSubscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"subscribed" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emailSubscriptions_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "savedTracks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "savedTracks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"trackId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storagePacks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "storagePacks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"packType" varchar(50) NOT NULL,
	"stripeSessionId" varchar(255),
	"purchasedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackStats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "trackStats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"trackId" integer NOT NULL,
	"playCount" integer DEFAULT 0 NOT NULL,
	"lastPlayedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trackStats_trackId_unique" UNIQUE("trackId")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tracks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(200) NOT NULL,
	"artist" varchar(200),
	"audioUrl" varchar(500) NOT NULL,
	"fileKey" varchar(500),
	"fileSize" integer,
	"categoryId" integer NOT NULL,
	"uploadedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
