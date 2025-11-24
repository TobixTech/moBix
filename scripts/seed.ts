import * as dotenv from "dotenv"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

// Load environment variables
dotenv.config({ path: ".env.local" })
dotenv.config()

console.log("🌱 Initializing seed script...")

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in environment variables.")
  process.exit(1)
}

async function main() {
  try {
    console.log("🔌 Connecting to database...")
    // Import db dynamically to ensure env vars are set
    const { db } = await import("../lib/db")
    const { movies, adSettings } = await import("../lib/db/schema")

    console.log("📽️  Preparing movie data...")
    const moviesToSeed = [
      {
        id: "d290f1ee-6c54-4b01-90e6-d701748f0851", // Explicit ID
        title: "Inception",
        description:
          "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        year: 2010,
        genre: "Sci-Fi",
        posterUrl: "/inception-movie-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        views: 1523,
        isTrending: true,
        isFeatured: true,
      },
      {
        id: "8a4f1539-95e2-4114-8f43-71e354972688",
        title: "The Dark Knight",
        description:
          "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        year: 2008,
        genre: "Action",
        posterUrl: "/dark-knight-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        views: 2341,
        isTrending: true,
        isFeatured: false,
      },
      {
        id: "c83b1c67-3e65-4f3b-85d2-0e5a6a57894a",
        title: "Interstellar",
        description:
          "A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.",
        year: 2014,
        genre: "Sci-Fi",
        posterUrl: "/interstellar-movie-poster.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        views: 1876,
        isTrending: true,
        isFeatured: false,
      },
      {
        id: "f1a2b3c4-d5e6-4f7g-8h9i-j0k1l2m3n4o5",
        title: "The Shawshank Redemption",
        description:
          "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        year: 1994,
        genre: "Drama",
        posterUrl: "/shawshank-redemption-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        views: 3124,
        isTrending: false,
        isFeatured: false,
      },
      {
        id: "a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5",
        title: "Pulp Fiction",
        description:
          "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
        year: 1994,
        genre: "Drama",
        posterUrl: "/generic-movie-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        views: 2654,
        isTrending: false,
        isFeatured: false,
      },
      {
        id: "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
        title: "The Matrix",
        description:
          "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
        year: 1999,
        genre: "Sci-Fi",
        posterUrl: "/matrix-movie-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        views: 2987,
        isTrending: true,
        isFeatured: false,
      },
      {
        id: "9z8y7x6w-5v4u-3t2s-1r0q-p9o8n7m6l5k4",
        title: "Mad Max: Fury Road",
        description:
          "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.",
        year: 2015,
        genre: "Action",
        posterUrl: "/mad-max-fury-road-poster.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        views: 1789,
        isTrending: false,
        isFeatured: false,
      },
      {
        id: "q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6",
        title: "The Grand Budapest Hotel",
        description:
          "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.",
        year: 2014,
        genre: "Comedy",
        posterUrl: "/grand-budapest-hotel-inspired-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        views: 1234,
        isTrending: false,
        isFeatured: false,
      },
    ]

    console.log("💾 Executing insertions...")
    let addedCount = 0
    let skippedCount = 0

    for (const movie of moviesToSeed) {
      // Check if movie exists by title
      const existing = await db.query.movies.findFirst({
        where: eq(movies.title, movie.title),
      })

      if (!existing) {
        // Use explicit ID to avoid DB default issues
        await db.insert(movies).values(movie)
        console.log(`   ✅ Inserted: ${movie.title}`)
        addedCount++
      } else {
        console.log(`   ⏭️  Skipped (exists): ${movie.title}`)
        skippedCount++
      }
    }

    // Seed Ad Settings
    console.log("📢 Checking ad settings...")
    const existingAdSettings = await db.query.adSettings.findFirst()

    if (!existingAdSettings) {
      await db.insert(adSettings).values({
        id: randomUUID(), // Explicit ID
        horizontalAdCode: "",
        verticalAdCode: "",
        homepageEnabled: false,
        movieDetailEnabled: false,
        dashboardEnabled: false,
        adTimeoutSeconds: 20,
      })
      console.log("   ✅ Default ad settings created")
    } else {
      console.log("   ⏭️  Ad settings already exist")
    }

    console.log(`✨ Seeding complete! Added: ${addedCount}, Skipped: ${skippedCount}`)
    process.exit(0)
  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error)
    process.exit(1)
  }
}

// Execute main function
main()
