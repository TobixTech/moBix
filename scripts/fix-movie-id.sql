-- Fix the Movie table ID to auto-generate UUIDs
-- This solves the "null value in column id" error without breaking existing string-based ID logic
ALTER TABLE "Movie" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
