-- TV Series Tables
-- Run this script to add series, seasons, and episodes tables

-- Series table
CREATE TABLE IF NOT EXISTS "Series" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug" TEXT UNIQUE,
  "title" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "posterUrl" TEXT NOT NULL,
  "bannerUrl" TEXT,
  "genre" TEXT NOT NULL,
  "releaseYear" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ongoing', -- 'ongoing', 'completed', 'cancelled'
  "totalSeasons" INTEGER DEFAULT 0,
  "totalEpisodes" INTEGER DEFAULT 0,
  "averageRating" DECIMAL(2,1) DEFAULT 0,
  "views" INTEGER DEFAULT 0,
  "isTrending" BOOLEAN DEFAULT false,
  "isFeatured" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Seasons table
CREATE TABLE IF NOT EXISTS "Season" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "seasonNumber" INTEGER NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "posterUrl" TEXT,
  "releaseYear" INTEGER,
  "totalEpisodes" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("seriesId", "seasonNumber")
);

-- Episodes table
CREATE TABLE IF NOT EXISTS "Episode" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "seasonId" TEXT NOT NULL REFERENCES "Season"("id") ON DELETE CASCADE,
  "episodeNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "duration" INTEGER, -- in minutes
  "thumbnailUrl" TEXT,
  "videoUrl" TEXT NOT NULL,
  "downloadUrl" TEXT,
  "downloadEnabled" BOOLEAN DEFAULT false,
  "views" INTEGER DEFAULT 0,
  "releaseDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("seasonId", "episodeNumber")
);

-- Series Watch History
CREATE TABLE IF NOT EXISTS "SeriesWatchHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "episodeId" TEXT NOT NULL REFERENCES "Episode"("id") ON DELETE CASCADE,
  "progress" INTEGER DEFAULT 0,
  "duration" INTEGER DEFAULT 0,
  "watchedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "episodeId")
);

-- Series Watchlist
CREATE TABLE IF NOT EXISTS "SeriesWatchlist" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "seriesId")
);

-- Series Ratings
CREATE TABLE IF NOT EXISTS "SeriesRating" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "rating" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "seriesId")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_series_genre" ON "Series"("genre");
CREATE INDEX IF NOT EXISTS "idx_series_status" ON "Series"("status");
CREATE INDEX IF NOT EXISTS "idx_series_trending" ON "Series"("isTrending");
CREATE INDEX IF NOT EXISTS "idx_season_series" ON "Season"("seriesId");
CREATE INDEX IF NOT EXISTS "idx_episode_season" ON "Episode"("seasonId");
CREATE INDEX IF NOT EXISTS "idx_series_watch_history_user" ON "SeriesWatchHistory"("userId");
CREATE INDEX IF NOT EXISTS "idx_series_watchlist_user" ON "SeriesWatchlist"("userId");
