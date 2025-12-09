-- Creator System Tables Migration
-- Run this script to create all creator-related tables

-- Creator Requests table
CREATE TABLE IF NOT EXISTS "CreatorRequest" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "requestedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "reviewedAt" TIMESTAMP,
  "reviewedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "rejectionReason" TEXT
);

-- Creator Profiles table
CREATE TABLE IF NOT EXISTS "CreatorProfile" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "isAutoApproveEnabled" BOOLEAN NOT NULL DEFAULT false,
  "dailyUploadLimit" INTEGER NOT NULL DEFAULT 4,
  "dailyStorageLimitGb" DECIMAL(5,2) NOT NULL DEFAULT 8,
  "totalUploads" INTEGER NOT NULL DEFAULT 0,
  "totalViews" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "suspendedReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Content Submissions table
CREATE TABLE IF NOT EXISTS "ContentSubmission" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "creatorId" TEXT NOT NULL REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "genre" TEXT NOT NULL,
  "year" INTEGER,
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT NOT NULL,
  "bannerUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "rejectionReason" TEXT,
  "submittedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "reviewedAt" TIMESTAMP,
  "reviewedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "viewsCount" INTEGER NOT NULL DEFAULT 0,
  "likesCount" INTEGER NOT NULL DEFAULT 0,
  "seriesData" TEXT,
  "publishedMovieId" TEXT REFERENCES "Movie"("id") ON DELETE SET NULL,
  "publishedSeriesId" TEXT REFERENCES "Series"("id") ON DELETE SET NULL,
  "fileSizeGb" DECIMAL(10,4)
);

-- Submission Episodes table (for series)
CREATE TABLE IF NOT EXISTS "SubmissionEpisode" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "submissionId" TEXT NOT NULL REFERENCES "ContentSubmission"("id") ON DELETE CASCADE,
  "seasonNumber" INTEGER NOT NULL,
  "episodeNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "videoUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "duration" INTEGER,
  "fileSizeGb" DECIMAL(10,4),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Creator Analytics table
CREATE TABLE IF NOT EXISTS "CreatorAnalytics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "submissionId" TEXT NOT NULL REFERENCES "ContentSubmission"("id") ON DELETE CASCADE,
  "date" TIMESTAMP NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "watchTimeMinutes" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "favorites" INTEGER NOT NULL DEFAULT 0
);

-- Creator Notifications table
CREATE TABLE IF NOT EXISTS "CreatorNotification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "submissionId" TEXT REFERENCES "ContentSubmission"("id") ON DELETE SET NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Creator Strikes table
CREATE TABLE IF NOT EXISTS "CreatorStrike" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "creatorId" TEXT NOT NULL REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "issuedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "isAppealed" BOOLEAN NOT NULL DEFAULT false,
  "appealReason" TEXT,
  "appealStatus" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Daily Upload Tracking table
CREATE TABLE IF NOT EXISTS "DailyUploadTracking" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "creatorId" TEXT NOT NULL REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
  "date" TIMESTAMP NOT NULL,
  "uploadsToday" INTEGER NOT NULL DEFAULT 0,
  "storageUsedTodayGb" DECIMAL(10,4) NOT NULL DEFAULT 0
);

-- Creator Settings table (global settings)
CREATE TABLE IF NOT EXISTS "CreatorSettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "minAccountAgeDays" INTEGER NOT NULL DEFAULT 30,
  "maxAccountAgeDays" INTEGER NOT NULL DEFAULT 90,
  "defaultDailyUploadLimit" INTEGER NOT NULL DEFAULT 4,
  "defaultDailyStorageLimitGb" DECIMAL(5,2) NOT NULL DEFAULT 8,
  "autoApproveNewCreators" BOOLEAN NOT NULL DEFAULT false,
  "maxStrikesBeforeSuspension" INTEGER NOT NULL DEFAULT 3,
  "isCreatorSystemEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default creator settings
INSERT INTO "CreatorSettings" (
  "minAccountAgeDays",
  "maxAccountAgeDays", 
  "defaultDailyUploadLimit",
  "defaultDailyStorageLimitGb",
  "autoApproveNewCreators",
  "maxStrikesBeforeSuspension",
  "isCreatorSystemEnabled"
) VALUES (30, 90, 4, 8, false, 3, true)
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_creator_requests_user" ON "CreatorRequest"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_requests_status" ON "CreatorRequest"("status");
CREATE INDEX IF NOT EXISTS "idx_creator_profiles_user" ON "CreatorProfile"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_profiles_status" ON "CreatorProfile"("status");
CREATE INDEX IF NOT EXISTS "idx_content_submissions_creator" ON "ContentSubmission"("creatorId");
CREATE INDEX IF NOT EXISTS "idx_content_submissions_status" ON "ContentSubmission"("status");
CREATE INDEX IF NOT EXISTS "idx_content_submissions_type" ON "ContentSubmission"("type");
CREATE INDEX IF NOT EXISTS "idx_submission_episodes_submission" ON "SubmissionEpisode"("submissionId");
CREATE INDEX IF NOT EXISTS "idx_creator_analytics_submission" ON "CreatorAnalytics"("submissionId");
CREATE INDEX IF NOT EXISTS "idx_creator_analytics_date" ON "CreatorAnalytics"("date");
CREATE INDEX IF NOT EXISTS "idx_creator_notifications_user" ON "CreatorNotification"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_notifications_read" ON "CreatorNotification"("isRead");
CREATE INDEX IF NOT EXISTS "idx_creator_strikes_creator" ON "CreatorStrike"("creatorId");
CREATE INDEX IF NOT EXISTS "idx_daily_upload_tracking_creator" ON "DailyUploadTracking"("creatorId");
CREATE INDEX IF NOT EXISTS "idx_daily_upload_tracking_date" ON "DailyUploadTracking"("date");
