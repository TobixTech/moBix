import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  console.log("Starting manual migration...")

  try {
    // Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" text PRIMARY KEY,
        "clerkId" text NOT NULL UNIQUE,
        "email" text NOT NULL UNIQUE,
        "role" text NOT NULL DEFAULT 'USER',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `
    console.log("Checked/Created User table")

    // Movies Table
    await sql`
      CREATE TABLE IF NOT EXISTS "Movie" (
        "id" text PRIMARY KEY,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "year" integer NOT NULL,
        "genre" text NOT NULL,
        "posterUrl" text NOT NULL,
        "videoUrl" text NOT NULL,
        "customVastUrl" text,
        "useGlobalAd" boolean NOT NULL DEFAULT true,
        "downloadUrl" text,
        "downloadEnabled" boolean NOT NULL DEFAULT false,
        "isTrending" boolean NOT NULL DEFAULT false,
        "isFeatured" boolean NOT NULL DEFAULT false,
        "views" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `
    console.log("Checked/Created Movie table")

    // Likes Table
    await sql`
      CREATE TABLE IF NOT EXISTS "Like" (
        "id" text PRIMARY KEY,
        "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "movieId" text NOT NULL REFERENCES "Movie"("id") ON DELETE CASCADE,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        UNIQUE("userId", "movieId")
      );
    `
    console.log("Checked/Created Like table")

    // Comments Table
    await sql`
      CREATE TABLE IF NOT EXISTS "Comment" (
        "id" text PRIMARY KEY,
        "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "movieId" text NOT NULL REFERENCES "Movie"("id") ON DELETE CASCADE,
        "text" text NOT NULL,
        "rating" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `
    console.log("Checked/Created Comment table")

    // Admin Invites Table
    await sql`
      CREATE TABLE IF NOT EXISTS "AdminInvite" (
        "id" text PRIMARY KEY,
        "code" text NOT NULL UNIQUE,
        "isValid" boolean NOT NULL DEFAULT true,
        "expiresAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `
    console.log("Checked/Created AdminInvite table")

    // Ad Settings Table
    await sql`
      CREATE TABLE IF NOT EXISTS "AdSettings" (
        "id" text PRIMARY KEY,
        "horizontalAdCode" text,
        "verticalAdCode" text,
        "vastUrl" text,
        "smartLinkUrl" text,
        "adTimeoutSeconds" integer NOT NULL DEFAULT 20,
        "showPrerollAds" boolean NOT NULL DEFAULT true,
        "showDownloadPageAds" boolean NOT NULL DEFAULT true,
        "homepageEnabled" boolean NOT NULL DEFAULT true,
        "movieDetailEnabled" boolean NOT NULL DEFAULT true,
        "dashboardEnabled" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `
    console.log("Checked/Created AdSettings table")

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

runMigration()
