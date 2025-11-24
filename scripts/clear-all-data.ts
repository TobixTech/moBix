import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function clearAllData() {
  try {
    console.log("[v0] 🗑️  Starting database cleanup...")

    // Delete in order to respect foreign key constraints
    // First delete child tables (likes, comments, watchlist)
    console.log("[v0] Deleting comments...")
    const commentsResult = await sql`DELETE FROM "Comment" RETURNING id`
    console.log(`[v0] ✅ Deleted ${commentsResult.length} comments`)

    console.log("[v0] Deleting likes...")
    const likesResult = await sql`DELETE FROM "Like" RETURNING id`
    console.log(`[v0] ✅ Deleted ${likesResult.length} likes`)

    console.log("[v0] Deleting watchlist entries...")
    const watchlistResult = await sql`DELETE FROM "Watchlist" RETURNING id`
    console.log(`[v0] ✅ Deleted ${watchlistResult.length} watchlist entries`)

    console.log("[v0] Deleting feedback entries...")
    const feedbackResult = await sql`DELETE FROM "Feedback" RETURNING id`
    console.log(`[v0] ✅ Deleted ${feedbackResult.length} feedback entries`)

    // Now delete parent table (movies)
    console.log("[v0] Deleting all movies...")
    const moviesResult = await sql`DELETE FROM "Movie" RETURNING id`
    console.log(`[v0] ✅ Deleted ${moviesResult.length} movies`)

    console.log("[v0] 🎉 Database cleanup completed successfully!")
    console.log("[v0] ℹ️  You can now upload new movies from the Admin Dashboard")

    process.exit(0)
  } catch (error) {
    console.error("[v0] ❌ Error clearing database:", error)
    process.exit(1)
  }
}

clearAllData()
