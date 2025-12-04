-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "endpoint" TEXT NOT NULL UNIQUE,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Watch History Table
CREATE TABLE IF NOT EXISTS "WatchHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "movieId" TEXT NOT NULL REFERENCES "Movie"("id") ON DELETE CASCADE,
  "progress" INTEGER DEFAULT 0 NOT NULL,
  "duration" INTEGER DEFAULT 0 NOT NULL,
  "watchedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("userId", "movieId")
);

-- Ratings Table
CREATE TABLE IF NOT EXISTS "Rating" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "movieId" TEXT NOT NULL REFERENCES "Movie"("id") ON DELETE CASCADE,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("userId", "movieId")
);

-- Content Reports Table
CREATE TABLE IF NOT EXISTS "ContentReport" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "movieId" TEXT NOT NULL REFERENCES "Movie"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT DEFAULT 'PENDING' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add averageRating column to movies
ALTER TABLE "Movie" ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(2,1) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_watch_history_user" ON "WatchHistory"("userId");
CREATE INDEX IF NOT EXISTS "idx_watch_history_movie" ON "WatchHistory"("movieId");
CREATE INDEX IF NOT EXISTS "idx_ratings_movie" ON "Rating"("movieId");
CREATE INDEX IF NOT EXISTS "idx_content_reports_status" ON "ContentReport"("status");
