import { sql } from "@neondatabase/serverless"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

async function migrate() {
  const db = sql(connectionString)

  console.log("🔄 Running database migrations...")

  try {
    // Create Watchlist table
    console.log("📋 Creating Watchlist table...")
    await db`
      CREATE TABLE IF NOT EXISTS "Watchlist" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" text NOT NULL,
        "movieId" text NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "Watchlist_userId_movieId_unique" UNIQUE ("userId", "movieId")
      )
    `
    console.log("✅ Watchlist table created")

    // Create Feedback table
    console.log("📋 Creating Feedback table...")
    await db`
      CREATE TABLE IF NOT EXISTS "Feedback" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "type" text NOT NULL,
        "title" text,
        "details" text,
        "email" text,
        "status" text DEFAULT 'NEW' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `
    console.log("✅ Feedback table created")

    // Add name column to User table if it doesn't exist
    console.log("📋 Adding name column to User table...")
    await db`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "name" text
    `
    console.log("✅ User table updated")

    console.log("🎉 All migrations completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  }
}

migrate()
  .then(() => {
    console.log("✅ Migration script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error)
    process.exit(1)
  })
