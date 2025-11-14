# moBix Quick Start Guide

## Database Setup (CRITICAL - DO THIS FIRST!)

The database tables don't exist yet. Run this command to initialize everything:

\`\`\`bash
npm run db:init
\`\`\`

This will:
1. Create all database tables
2. Generate Prisma client
3. Seed sample movies and admin invitation codes

## Getting Admin Access

### Method 1: Admin Access Key (RECOMMENDED)

1. Sign up for a regular user account at `/`
2. Visit `/admin/access-key`
3. Enter the secret key: `MOBIX_SECRET_2024`
4. You'll be instantly granted admin access!

### Method 2: Environment Variable (Alternative)

Add this to your Vercel environment variables:
\`\`\`
ADMIN_SECRET_KEY=your_custom_secret_key_here
\`\`\`

Then use your custom key at `/admin/access-key`

## Viewing Database Tables

### Option 1: Neon Dashboard
1. Go to https://neon.tech
2. Login to your account
3. Select your project
4. Go to Tables tab
5. Browse all tables: User, Movie, Like, Comment, etc.

### Option 2: Prisma Studio (Local)
\`\`\`bash
npx prisma studio
\`\`\`

This opens a web interface at http://localhost:5555 to view and edit all database records.

## Troubleshooting

**Error: "Table does not exist"**
- Run `npm run db:init` to create tables
- Or manually: `npx prisma db push`

**Admin access not working**
- Make sure you're signed in first
- Check that ADMIN_SECRET_KEY matches in your environment
- Default key is: `MOBIX_SECRET_2024`

**Can't see database changes**
- Run `npx prisma studio` to view data
- Check Neon dashboard for table structure
