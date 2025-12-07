-- Create SeriesReport table if it doesn't exist
CREATE TABLE IF NOT EXISTS "SeriesReport" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "email" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_series_reports_series_id" ON "SeriesReport"("seriesId");
CREATE INDEX IF NOT EXISTS "idx_series_reports_user_id" ON "SeriesReport"("userId");
CREATE INDEX IF NOT EXISTS "idx_series_reports_status" ON "SeriesReport"("status");
CREATE INDEX IF NOT EXISTS "idx_series_reports_created_at" ON "SeriesReport"("createdAt" DESC);
