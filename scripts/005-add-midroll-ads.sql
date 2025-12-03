-- Add midroll ad columns to AdSettings
ALTER TABLE "AdSettings" ADD COLUMN IF NOT EXISTS "midrollAdCodes" text DEFAULT '[]';
ALTER TABLE "AdSettings" ADD COLUMN IF NOT EXISTS "midrollEnabled" boolean DEFAULT false;
ALTER TABLE "AdSettings" ADD COLUMN IF NOT EXISTS "midrollIntervalMinutes" integer DEFAULT 20;
ALTER TABLE "AdSettings" ADD COLUMN IF NOT EXISTS "prerollEnabled" boolean DEFAULT true;
