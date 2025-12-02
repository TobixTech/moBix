-- Migration: Add prerollAdCodes column and rename if needed
-- This migration adds a new column for preroll ad codes (HTML codes instead of image URLs)

-- Add the new column if it doesn't exist
ALTER TABLE "AdSettings" 
ADD COLUMN IF NOT EXISTS "prerollAdCodes" TEXT DEFAULT '[]';

-- Copy data from old column to new if old exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdSettings' AND column_name = 'prerollBannerAds'
  ) THEN
    -- The old column exists, we can keep it for backwards compatibility
    -- or copy data if needed
    NULL;
  END IF;
END $$;
