-- Add email column to ContentReport table if it doesn't exist
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "email" text;
