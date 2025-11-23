import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log("Starting migration v2...")

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Watchlist" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "movieId" text NOT NULL REFERENCES "Movie"("id") ON DELETE CASCADE,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "Watchlist_userId_movieId_unique" UNIQUE ("userId", "movieId")
      );
    `
    console.log("Created Watchlist table")

    await sql`
      CREATE TABLE IF NOT EXISTS "Feedback" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" text NOT NULL,
        "title" text,
        "details" text,
        "email" text,
        "status" text DEFAULT 'NEW' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `
    console.log("Created Feedback table")

    console.log("Migration v2 completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

main()
