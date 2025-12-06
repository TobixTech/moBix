-- Add series reports table
CREATE TABLE IF NOT EXISTS "SeriesReport" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "email" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for series reports
CREATE INDEX IF NOT EXISTS "idx_series_reports_series" ON "SeriesReport"("seriesId");
CREATE INDEX IF NOT EXISTS "idx_series_reports_user" ON "SeriesReport"("userId");
CREATE INDEX IF NOT EXISTS "idx_series_reports_status" ON "SeriesReport"("status");

-- Add download columns to episodes if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Episode' AND column_name = 'downloadUrl') THEN
    ALTER TABLE "Episode" ADD COLUMN "downloadUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Episode' AND column_name = 'downloadEnabled') THEN
    ALTER TABLE "Episode" ADD COLUMN "downloadEnabled" BOOLEAN DEFAULT false;
  END IF;
END $$;
