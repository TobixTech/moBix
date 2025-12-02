-- Add new columns for banner-based preroll ads
ALTER TABLE "AdSettings" ADD COLUMN IF NOT EXISTS "prerollBannerAds" TEXT DEFAULT '[]';
ALTER TABLE "AdSettings" ADD COLUMN IF NOT EXISTS "skipDelaySeconds" INTEGER DEFAULT 10;
ALTER TABLE "AdSettings" ADD COLUMN IF NOT EXISTS "rotationIntervalSeconds" INTEGER DEFAULT 5;

-- Update comment for clarity
COMMENT ON COLUMN "AdSettings"."prerollBannerAds" IS 'JSON array of {imageUrl, clickUrl, altText} objects for rotating banner ads';
