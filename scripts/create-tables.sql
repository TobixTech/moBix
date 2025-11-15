-- Create all necessary tables for moBix
-- Run this with: psql $DATABASE_URL -f scripts/create-tables.sql

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "clerkId" TEXT UNIQUE NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "role" TEXT DEFAULT 'USER',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movie table  
CREATE TABLE IF NOT EXISTS "Movie" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "genre" TEXT NOT NULL,
  "posterUrl" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "isTrending" BOOLEAN DEFAULT FALSE,
  "isFeatured" BOOLEAN DEFAULT FALSE,
  "views" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Like table
CREATE TABLE IF NOT EXISTS "Like" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "movieId" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE,
  UNIQUE("userId", "movieId")
);

-- Comment table
CREATE TABLE IF NOT EXISTS "Comment" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "movieId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "rating" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE
);

-- AdminInvite table
CREATE TABLE IF NOT EXISTS "AdminInvite" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "isValid" BOOLEAN DEFAULT TRUE,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AdSettings table
CREATE TABLE IF NOT EXISTS "AdSettings" (
  "id" TEXT PRIMARY KEY,
  "horizontalAdCode" TEXT,
  "verticalAdCode" TEXT,
  "homepageEnabled" BOOLEAN DEFAULT TRUE,
  "movieDetailEnabled" BOOLEAN DEFAULT TRUE,
  "dashboardEnabled" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin invite code
INSERT INTO "AdminInvite" ("id", "code", "isValid", "expiresAt")
VALUES (gen_random_uuid()::text, 'MOBIX_SECRET_2024', TRUE, NULL)
ON CONFLICT DO NOTHING;
