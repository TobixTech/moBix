-- Add isPremium column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "premiumExpiresAt" TIMESTAMP;

-- Add isTop column to Movie table for featured/pinned movies
ALTER TABLE "Movie" ADD COLUMN IF NOT EXISTS "isTop" BOOLEAN DEFAULT false NOT NULL;

-- Add seriesId to notifications table for series notifications
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;
