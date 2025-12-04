-- Add Notifications table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'general', -- 'new_movie', 'system', 'general'
  "movieId" TEXT REFERENCES "Movie"("id") ON DELETE CASCADE,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "notification_user_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "notification_read_idx" ON "Notification"("isRead");
