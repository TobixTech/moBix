# Database Structure and Access Guide

This document explains how to access and understand the moBix database structure.

## Database Provider

**Neon PostgreSQL** - Serverless Postgres with instant provisioning and autoscaling.

## Accessing Your Database

### Method 1: Neon Dashboard (Web Interface)

1. Visit [https://console.neon.tech](https://console.neon.tech)
2. Sign in with your Neon account
3. Select your project: **moBix**
4. Navigate through the interface:
   - **SQL Editor**: Run custom SQL queries
   - **Tables**: Browse all tables and data
   - **Branches**: Manage database branches
   - **Settings**: View connection strings and settings

### Method 2: Prisma Studio (Local Development)

\`\`\`bash
# From your project root directory
npx prisma studio
\`\`\`

This opens a GUI at `http://localhost:5555` where you can:
- Browse all tables
- Add/edit/delete records
- Filter and search data
- See relationships between tables

## Database Schema

### User Table
Stores all registered users (both regular and admin).

\`\`\`prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique  // Clerk authentication ID
  email     String   @unique
  role      Role     @default(USER)  // USER or ADMIN
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  likes     Like[]
  comments  Comment[]
}
\`\`\`

**Key Fields:**
- `clerkId`: Links to Clerk authentication system
- `role`: Determines if user is ADMIN or USER
- Check this table to verify admin role assignments

### Movie Table
Stores all uploaded movies.

\`\`\`prisma
model Movie {
  id          String   @id @default(cuid())
  title       String
  description String
  year        Int
  genre       String
  posterUrl   String
  videoUrl    String
  isTrending  Boolean  @default(false)
  isFeatured  Boolean  @default(false)
  views       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  likes       Like[]
  comments    Comment[]
}
\`\`\`

### Like Table
Tracks which users liked which movies.

\`\`\`prisma
model Like {
  id        String   @id @default(cuid())
  userId    String
  movieId   String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie     Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)
  
  @@unique([userId, movieId])  // Prevents duplicate likes
}
\`\`\`

### Comment Table
Stores user reviews and ratings.

\`\`\`prisma
model Comment {
  id        String   @id @default(cuid())
  userId    String
  movieId   String
  text      String
  rating    Int      // 1-5 stars
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie     Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)
}
\`\`\`

### AdSettings Table
Stores advertisement configuration.

\`\`\`prisma
model AdSettings {
  id                  String  @id @default(cuid())
  horizontalAdCode    String
  verticalAdCode      String
  homepageEnabled     Boolean @default(false)
  movieDetailEnabled  Boolean @default(false)
  dashboardEnabled    Boolean @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
\`\`\`

## Common Database Queries

### Check Admin Users
\`\`\`sql
SELECT id, email, role, "clerkId", "createdAt" 
FROM "User" 
WHERE role = 'ADMIN';
\`\`\`

### Count Total Movies
\`\`\`sql
SELECT COUNT(*) FROM "Movie";
\`\`\`

### Get Most Liked Movies
\`\`\`sql
SELECT m.title, COUNT(l.id) as like_count
FROM "Movie" m
LEFT JOIN "Like" l ON m.id = l."movieId"
GROUP BY m.id, m.title
ORDER BY like_count DESC
LIMIT 10;
\`\`\`

### Get Recent Comments
\`\`\`sql
SELECT c.text, c.rating, u.email, m.title, c."createdAt"
FROM "Comment" c
JOIN "User" u ON c."userId" = u.id
JOIN "Movie" m ON c."movieId" = m.id
ORDER BY c."createdAt" DESC
LIMIT 20;
\`\`\`

### Check User Activity
\`\`\`sql
SELECT 
  u.email,
  COUNT(DISTINCT l.id) as total_likes,
  COUNT(DISTINCT c.id) as total_comments
FROM "User" u
LEFT JOIN "Like" l ON u.id = l."userId"
LEFT JOIN "Comment" c ON u.id = c."userId"
GROUP BY u.id, u.email
ORDER BY total_likes + total_comments DESC;
\`\`\`

## Seeding the Database

To populate the database with sample data:

\`\`\`bash
npm run seed
\`\`\`

This will create:
- Admin invitation code
- 8 sample movies across different genres
- Default ad settings

## Backup and Restore

### Export Data (Neon Dashboard)
1. Go to Neon Console
2. Select your database
3. Use SQL Editor to run:
\`\`\`sql
-- Export specific table
COPY "User" TO '/path/to/backup.csv' CSV HEADER;
\`\`\`

### Reset Database
\`\`\`bash
# Delete all data and recreate schema
npx prisma migrate reset

# Seed with sample data
npm run seed
\`\`\`

## Troubleshooting

### Can't Connect to Database
- Check `DATABASE_URL` in environment variables
- Verify Neon project is active (not paused)
- Check Neon dashboard for connection status

### Tables Not Showing Up
\`\`\`bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
\`\`\`

### Data Not Syncing
- Check if Prisma client is properly initialized
- Verify server actions are using `await prisma...`
- Check for transaction errors in logs

## Database Monitoring

Monitor your database health in Neon Dashboard:
- **Queries**: View query performance
- **Connections**: Monitor active connections
- **Storage**: Check database size
- **Metrics**: View usage statistics
