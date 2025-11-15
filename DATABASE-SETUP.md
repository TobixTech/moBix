# Database Setup Guide

## Quick Setup (Using Vercel/Neon)

The database tables need to be created before the app can function. Here are your options:

### Option 1: Use Prisma Push (Recommended)

This will create all tables automatically from the Prisma schema:

\`\`\`bash
npx prisma db push
\`\`\`

### Option 2: Use SQL Script

If you prefer to see what's being created, run the SQL script:

\`\`\`bash
# Get your DATABASE_URL from Vercel environment variables
# Then run:
psql $DATABASE_URL -f scripts/create-tables.sql
\`\`\`

### Option 3: Prisma Studio (Visual Tool)

To view and manage your database visually:

\`\`\`bash
npx prisma studio
\`\`\`

This opens a browser interface where you can see all tables and data.

## Verify Tables Were Created

After running either command above, check your Neon dashboard at https://neon.tech:

1. Go to your project
2. Click "Tables" in the sidebar
3. You should see: User, Movie, Like, Comment, AdminInvite, AdSettings

## Environment Variables Required

Make sure these are set in your Vercel project:

- `DATABASE_URL` - Your Neon database connection string
- `ADMIN_PIN` - Your 4-digit admin PIN (e.g., "1234")
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

## Troubleshooting

**Error: "The table public.Movie does not exist"**
- Run `npx prisma db push` to create tables
- Or deploy to Vercel (it will run automatically during build)

**Error: "Invalid prisma.movie.create() invocation"**
- Tables aren't created yet
- Run the setup commands above

**Want to reset everything?**
\`\`\`bash
npx prisma db push --force-reset
\`\`\`
(WARNING: This deletes all data!)

## Manual Ad Code Setup

Since the ads section has been removed from the admin dashboard, you can add ad codes manually to the database using Prisma Studio or SQL:

\`\`\`sql
INSERT INTO "AdSettings" ("id", "horizontalAdCode", "verticalAdCode", "homepageEnabled", "movieDetailEnabled")
VALUES (gen_random_uuid()::text, 'YOUR_AD_CODE_HERE', 'YOUR_AD_CODE_HERE', TRUE, TRUE)
ON CONFLICT DO NOTHING;
