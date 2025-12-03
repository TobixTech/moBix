-- Add slug column to movies table
ALTER TABLE "Movie" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS "Movie_slug_key" ON "Movie"("slug");

-- Generate slugs for existing movies (lowercase, hyphens, no special chars)
UPDATE "Movie" 
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE "slug" IS NULL;
