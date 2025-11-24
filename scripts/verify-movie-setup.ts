import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function verifySetup() {
  try {
    console.log("[v0] 🔍 Verifying movie system setup...")

    // Check table structure
    console.log("\n[v0] Checking Movie table structure...")
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Movie'
      ORDER BY ordinal_position
    `
    console.log(`[v0] ✅ Movie table has ${tableInfo.length} columns:`)
    tableInfo.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "(required)" : "(optional)"}`)
    })

    // Check current movie count
    console.log("\n[v0] Checking current movie count...")
    const movieCount = await sql`SELECT COUNT(*) as count FROM "Movie"`
    console.log(`[v0] 📊 Current movies in database: ${movieCount[0].count}`)

    if (movieCount[0].count > 0) {
      // Show sample movies
      const sampleMovies = await sql`
        SELECT id, title, "posterUrl", "videoUrl", "createdAt"
        FROM "Movie"
        ORDER BY "createdAt" DESC
        LIMIT 3
      `
      console.log("\n[v0] 🎬 Sample movies:")
      sampleMovies.forEach((movie: any, index: number) => {
        console.log(`   ${index + 1}. ${movie.title}`)
        console.log(`      ID: ${movie.id}`)
        console.log(`      URL: /movie/${movie.id}`)
        console.log(`      Poster: ${movie.posterUrl ? "✅" : "❌"}`)
        console.log(`      Video: ${movie.videoUrl ? "✅" : "❌"}`)
      })
    }

    // Check related tables
    console.log("\n[v0] Checking related data...")
    const likesCount = await sql`SELECT COUNT(*) as count FROM "Like"`
    const commentsCount = await sql`SELECT COUNT(*) as count FROM "Comment"`
    const watchlistCount = await sql`SELECT COUNT(*) as count FROM "Watchlist"`

    console.log(`[v0] 💖 Likes: ${likesCount[0].count}`)
    console.log(`[v0] 💬 Comments: ${commentsCount[0].count}`)
    console.log(`[v0] 📌 Watchlist items: ${watchlistCount[0].count}`)

    console.log("\n[v0] ✅ Verification complete!")

    process.exit(0)
  } catch (error) {
    console.error("[v0] ❌ Error during verification:", error)
    process.exit(1)
  }
}

verifySetup()
