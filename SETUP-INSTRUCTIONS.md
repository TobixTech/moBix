# moBix Setup Instructions

## Quick Setup (5 minutes)

### 1. Initialize Database Tables

Run this command in your terminal or in Vercel:

\`\`\`bash
npx prisma db push
\`\`\`

This will create all necessary tables in your Neon database:
- User
- Movie
- Like
- Comment
- AdminInvite
- AdSettings

### 2. Access Admin Dashboard

**Step 1:** Sign in to a regular account first
- Go to your website homepage
- Click "Login" or "Sign Up"
- Create/login to any account

**Step 2:** Grant yourself admin access
- Visit: `/admin/access-key`
- Enter the secret key: `MOBIX_SECRET_2024` (or your custom `ADMIN_SECRET_KEY` from environment variables)
- Click "Grant Admin Access"
- Wait for success message and automatic redirect

**Step 3:** Enter admin PIN
- You'll be redirected to `/admin/dashboard`
- Enter your 4-digit PIN: `1234` (or your custom `ADMIN_PIN` from environment variables)
- Click "Unlock Dashboard"

### 3. Start Using Admin Dashboard

Now you can:
- Upload movies (with title, thumbnail URL, video URL, genre, etc.)
- Manage existing movies (edit/delete)
- View user statistics
- Moderate comments
- Manage users

## Environment Variables

Make sure these are set in your Vercel project:

\`\`\`env
# Database (Neon - already configured)
DATABASE_URL=your_neon_connection_string

# Admin Access
ADMIN_SECRET_KEY=MOBIX_SECRET_2024
ADMIN_PIN=1234

# Clerk Authentication (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
\`\`\`

## Troubleshooting

### "Table does not exist" error
Run: `npx prisma db push` to create tables

### Can't access admin dashboard
1. Make sure you're signed in first
2. Go to `/admin/access-key` and enter the secret key
3. Enter the PIN on the dashboard

### Upload fails with "Unauthorized"
The PIN protection is now in place - just enter your PIN on the dashboard page
\`\`\`
