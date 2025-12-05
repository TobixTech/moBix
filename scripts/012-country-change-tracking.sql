-- Add countryChangedAt column to track if user has changed their country (one-time only)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "countryChangedAt" TIMESTAMP;
