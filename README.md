# moBix - Movie Streaming Platform

A modern movie streaming platform built with Next.js 16, Prisma, and Clerk authentication.

## Features

- User authentication with Clerk
- Admin dashboard with full CRUD operations
- Movie upload and management
- User likes and comments system
- Dynamic ad management
- Genre-based movie carousels
- Search functionality
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Neon PostgreSQL database
- Clerk account for authentication

### Installation

1. Clone the repository
2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a `.env.local` file with the following variables:
\`\`\`
DATABASE_URL="your-neon-database-url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
ADMIN_INVITATION_CODE="MOBIX_ADMIN_2024"
\`\`\`

4. Push the database schema:
\`\`\`bash
npm run db:push
\`\`\`

5. Seed the database with sample data:
\`\`\`bash
npm run db:seed
\`\`\`

6. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Admin Access

To create an admin account:

1. Go to `/admin/signup`
2. Sign up with your email
3. Use the admin invitation code: `MOBIX_ADMIN_2024` (or your custom code from `.env.local`)
4. Complete email verification
5. You'll be redirected to the admin dashboard

Note: Maximum 2 admin accounts are allowed.

## Database Schema

The application uses the following main models:

- **User** - User accounts with roles (USER/ADMIN)
- **Movie** - Movie content with metadata
- **Like** - User likes on movies
- **Comment** - User comments and ratings
- **AdminInvite** - Admin invitation codes
- **AdSettings** - Advertisement configuration

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

The app will automatically run `prisma generate` during the build process.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with sample data

## Technologies Used

- **Next.js 16** - React framework with App Router
- **Prisma** - Database ORM
- **Clerk** - Authentication
- **Neon** - PostgreSQL database
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## License

MIT
