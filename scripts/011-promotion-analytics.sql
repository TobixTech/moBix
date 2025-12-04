-- Promotion views/analytics table
CREATE TABLE IF NOT EXISTS "PromotionView" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "ipAddress" TEXT NOT NULL,
  "country" TEXT,
  "viewedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "submitted" BOOLEAN DEFAULT FALSE NOT NULL
);

-- Targeted promotions table (for manually selecting users)
CREATE TABLE IF NOT EXISTS "TargetedPromotion" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reason" TEXT,
  "shown" BOOLEAN DEFAULT FALSE NOT NULL,
  "dismissed" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "shownAt" TIMESTAMP
);

-- Add PREMIUM to role options (update existing users table if needed)
-- The role column already exists, we just need to ensure PREMIUM is a valid option

-- Index for faster queries
CREATE INDEX IF NOT EXISTS "idx_promotion_view_user" ON "PromotionView"("userId");
CREATE INDEX IF NOT EXISTS "idx_targeted_promo_user" ON "TargetedPromotion"("userId");
CREATE INDEX IF NOT EXISTS "idx_targeted_promo_shown" ON "TargetedPromotion"("shown");
