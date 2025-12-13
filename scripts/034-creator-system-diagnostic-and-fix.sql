-- Creator System Diagnostic and Fix Script
-- This script checks if all required tables exist and fixes any issues

-- First, check if tables exist (for diagnostic purposes)
DO $$
BEGIN
    -- Check User table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        RAISE NOTICE 'ERROR: User table does not exist!';
    ELSE
        RAISE NOTICE 'OK: User table exists';
    END IF;
    
    -- Check CreatorRequest table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CreatorRequest') THEN
        RAISE NOTICE 'WARNING: CreatorRequest table does not exist - will create';
    ELSE
        RAISE NOTICE 'OK: CreatorRequest table exists';
    END IF;
    
    -- Check CreatorProfile table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CreatorProfile') THEN
        RAISE NOTICE 'WARNING: CreatorProfile table does not exist - will create';
    ELSE
        RAISE NOTICE 'OK: CreatorProfile table exists';
    END IF;
END$$;

-- Now create/fix the creator system tables if they don't exist

-- Creator Requests table
CREATE TABLE IF NOT EXISTS "CreatorRequest" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "reviewedAt" TIMESTAMP,
    "reviewedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "rejectionReason" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_creator_request_user" ON "CreatorRequest"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_request_status" ON "CreatorRequest"("status");

-- Creator Profiles table
CREATE TABLE IF NOT EXISTS "CreatorProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "isAutoApproveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyUploadLimit" INTEGER NOT NULL DEFAULT 4,
    "dailyStorageLimitGb" DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    "totalUploads" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "suspendedReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_creator_profile_user" ON "CreatorProfile"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_profile_status" ON "CreatorProfile"("status");

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
    "submittedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "reviewedAt" TIMESTAMP,
    "reviewedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "seriesData" TEXT,
    "publishedMovieId" TEXT REFERENCES "Movie"("id") ON DELETE SET NULL,
    "publishedSeriesId" TEXT REFERENCES "Series"("id") ON DELETE SET NULL,
    "fileSizeGb" DECIMAL(10,4)
);

CREATE INDEX IF NOT EXISTS "idx_content_submission_creator" ON "ContentSubmission"("creatorId");
CREATE INDEX IF NOT EXISTS "idx_content_submission_status" ON "ContentSubmission"("status");

-- Submission Episodes table
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_submission_episode_submission" ON "SubmissionEpisode"("submissionId");

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

CREATE INDEX IF NOT EXISTS "idx_creator_analytics_submission" ON "CreatorAnalytics"("submissionId");
CREATE INDEX IF NOT EXISTS "idx_creator_analytics_date" ON "CreatorAnalytics"("date");

-- Creator Settings table (global settings)
CREATE TABLE IF NOT EXISTS "CreatorSettings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "minAccountAgeDays" INTEGER NOT NULL DEFAULT 30,
    "maxAccountAgeDays" INTEGER NOT NULL DEFAULT 90,
    "defaultDailyUploadLimit" INTEGER NOT NULL DEFAULT 4,
    "defaultDailyStorageLimitGb" DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    "autoApproveNewCreators" BOOLEAN NOT NULL DEFAULT false,
    "maxStrikesBeforeSuspension" INTEGER NOT NULL DEFAULT 3,
    "isCreatorSystemEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default creator settings if not exists
INSERT INTO "CreatorSettings" ("id", "minAccountAgeDays", "maxAccountAgeDays", "defaultDailyUploadLimit", "defaultDailyStorageLimitGb", "autoApproveNewCreators", "maxStrikesBeforeSuspension", "isCreatorSystemEnabled")
VALUES ('default', 30, 90, 4, 8.00, false, 3, true)
ON CONFLICT ("id") DO NOTHING;

-- Creator Notifications table
CREATE TABLE IF NOT EXISTS "CreatorNotification" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_creator_notification_user" ON "CreatorNotification"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_notification_read" ON "CreatorNotification"("isRead");

-- Daily Upload Tracking table
CREATE TABLE IF NOT EXISTS "DailyUploadTracking" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "creatorId" TEXT NOT NULL REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
    "date" TIMESTAMP NOT NULL,
    "uploadsToday" INTEGER NOT NULL DEFAULT 0,
    "storageUsedTodayGb" DECIMAL(10,4) NOT NULL DEFAULT 0,
    UNIQUE("creatorId", "date")
);

CREATE INDEX IF NOT EXISTS "idx_daily_upload_tracking_creator_date" ON "DailyUploadTracking"("creatorId", "date");

-- Creator Strikes table
CREATE TABLE IF NOT EXISTS "CreatorStrike" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "creatorId" TEXT NOT NULL REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "issuedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "issuedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_creator_strike_creator" ON "CreatorStrike"("creatorId");

-- Verify all tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN (
        'CreatorRequest',
        'CreatorProfile', 
        'ContentSubmission',
        'SubmissionEpisode',
        'CreatorAnalytics',
        'CreatorSettings',
        'CreatorNotification',
        'DailyUploadTracking',
        'CreatorStrike'
    );
    
    IF table_count = 9 THEN
        RAISE NOTICE 'SUCCESS: All 9 creator system tables exist!';
    ELSE
        RAISE NOTICE 'WARNING: Only % out of 9 creator tables exist', table_count;
    END IF;
END$$;
