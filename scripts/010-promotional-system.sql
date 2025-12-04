-- Add country and IP tracking columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" text;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ipAddress" text;

-- Create promotions table
CREATE TABLE IF NOT EXISTS "Promotion" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text REFERENCES "User"("id") ON DELETE SET NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "network" text NOT NULL,
  "ipAddress" text NOT NULL,
  "country" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Create IP blacklist table
CREATE TABLE IF NOT EXISTS "IpBlacklist" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ipAddress" text UNIQUE NOT NULL,
  "reason" text,
  "blacklistedBy" text,
  "blacklistedAt" timestamp DEFAULT now() NOT NULL
);

-- Create promotion settings table
CREATE TABLE IF NOT EXISTS "PromotionSettings" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "isActive" boolean DEFAULT false NOT NULL,
  "enabledCountries" text DEFAULT '["Nigeria"]',
  "headline" text DEFAULT 'Fill Details to Get 1.5GB Data!',
  "subtext" text DEFAULT '(Lucky Draw - Winners announced weekly)',
  "successMessage" text DEFAULT 'Entry recorded! Winners announced every Monday',
  "networkOptions" text DEFAULT '{"Nigeria":["MTN","Airtel","Glo","9mobile","Other"],"Ghana":["MTN","Vodafone","AirtelTigo","Other"],"Kenya":["Safaricom","Airtel","Telkom","Other"]}',
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Insert default promotion settings
INSERT INTO "PromotionSettings" ("id", "isActive", "enabledCountries", "headline", "subtext", "successMessage", "networkOptions")
VALUES (
  'default-promotion-settings',
  false,
  '["Nigeria"]',
  'Fill Details to Get 1.5GB Data!',
  '(Lucky Draw - Winners announced weekly)',
  'Entry recorded! Winners announced every Monday',
  '{"Nigeria":["MTN","Airtel","Glo","9mobile","Other"],"Ghana":["MTN","Vodafone","AirtelTigo","Other"],"Kenya":["Safaricom","Airtel","Telkom","Other"]}'
) ON CONFLICT ("id") DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_promotion_ip" ON "Promotion"("ipAddress");
CREATE INDEX IF NOT EXISTS "idx_promotion_email" ON "Promotion"("email");
CREATE INDEX IF NOT EXISTS "idx_promotion_country" ON "Promotion"("country");
CREATE INDEX IF NOT EXISTS "idx_user_country" ON "User"("country");
CREATE INDEX IF NOT EXISTS "idx_user_ip" ON "User"("ipAddress");
CREATE INDEX IF NOT EXISTS "idx_blacklist_ip" ON "IpBlacklist"("ipAddress");
