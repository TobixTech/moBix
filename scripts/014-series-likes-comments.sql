-- Series Likes Table
CREATE TABLE IF NOT EXISTS "SeriesLike" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("userId", "seriesId")
);

-- Series Comments Table
CREATE TABLE IF NOT EXISTS "SeriesComment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "rating" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add likesCount column to Series if not exists
ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "likesCount" INTEGER DEFAULT 0 NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_series_like_user" ON "SeriesLike"("userId");
CREATE INDEX IF NOT EXISTS "idx_series_like_series" ON "SeriesLike"("seriesId");
CREATE INDEX IF NOT EXISTS "idx_series_comment_series" ON "SeriesComment"("seriesId");
