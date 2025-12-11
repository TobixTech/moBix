-- Add globallyDisabled column to PromotionSettings
ALTER TABLE "PromotionSettings" ADD COLUMN IF NOT EXISTS "globallyDisabled" BOOLEAN DEFAULT false NOT NULL;
