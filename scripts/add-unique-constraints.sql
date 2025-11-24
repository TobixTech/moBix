-- Migration script to add UNIQUE constraint to Movie.title
-- This allows ON CONFLICT (title) to work in seed scripts

-- Add unique constraint to title column in Movie table
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_title_unique" UNIQUE ("title");

-- Verify the constraint was added
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = '"Movie"'::regclass;
