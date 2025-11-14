# Testing Multiple Accounts on moBix

This guide explains how to test multiple user accounts on the same device for development purposes.

## Understanding Clerk's Session Management

Clerk (the authentication provider) allows **only one active session per browser** by default. This is a security feature to prevent session conflicts. To test multiple accounts on the same device, you have several options:

## Method 1: Sign Out Between Accounts (Recommended)

1. **Sign out of the current account** before creating or logging into a new one
2. Use the "sign out first" button on the admin signup/login pages
3. This ensures a clean session for the new account

### Steps:
\`\`\`bash
1. Log in with Account A
2. Test features
3. Click "Sign Out" (in navbar or admin pages)
4. Sign up/Log in with Account B
5. Test features
\`\`\`

## Method 2: Use Different Browsers

Test different accounts simultaneously by using:
- Chrome for Admin Account 1
- Firefox for Admin Account 2
- Safari for Regular User
- Edge for another Regular User

## Method 3: Use Incognito/Private Windows

Open multiple incognito/private windows:
- `Ctrl+Shift+N` (Chrome/Edge)
- `Ctrl+Shift+P` (Firefox)
- `Cmd+Shift+N` (Safari)

Each incognito window has its own isolated session.

## Method 4: Use Different Browser Profiles

Create separate browser profiles:
- Chrome: Settings → People → Add Person
- Firefox: `about:profiles`
- Each profile has independent sessions

## Debugging Admin Sign-up Issues

### Common "Session Exists" Error

**Problem**: Getting "session exists" error when trying to create admin account

**Solution**:
1. Open browser console (F12)
2. Look for `[v0]` prefixed logs
3. Check the flow:
   - `[v0] Starting admin signup process...`
   - `[v0] Verifying invitation code...`
   - `[v0] Checking admin count...`
   - `[v0] Creating user account...`
   - `[v0] Moving to verification step...`

4. If error occurs:
   - Sign out completely
   - Clear browser cookies for localhost
   - Try again

### Checking Database Tables

You have two options to view your database tables:

#### Option 1: Neon Dashboard (Recommended)
1. Go to [https://neon.tech](https://neon.tech)
2. Log in to your account
3. Select your project: **moBix**
4. Click on "Tables" in the sidebar
5. View tables:
   - `User` - All registered users
   - `Movie` - All uploaded movies
   - `Like` - User likes on movies
   - `Comment` - User comments and ratings
   - `AdminInvite` - Admin invitation codes
   - `AdSettings` - Advertisement settings

#### Option 2: Prisma Studio (Local Development)
\`\`\`bash
# Run this command in your project directory
npx prisma studio
\`\`\`

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- See user details (Clerk IDs, emails, roles)
- Check admin roles assigned
- View all data in a user-friendly interface

### Verifying Admin Role Assignment

1. **Check in Database**:
   - Open Prisma Studio or Neon Dashboard
   - Go to `User` table
   - Look for the user with your email
   - Check the `role` column - should show `ADMIN`

2. **Check in Clerk Dashboard**:
   - Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
   - Select your application
   - Go to Users
   - Find your user
   - Check `publicMetadata` - should show `{ "role": "admin" }`

## Admin Invitation Code

The admin invitation code is stored as an environment variable:
- Variable name: `ADMIN_INVITATION_CODE`
- Default value: `MOBIX_ADMIN_2024` (if not set)

To create admin accounts, you need this code during signup.

## Testing Checklist

### Regular User Flow
- [ ] Sign up with email/password
- [ ] Verify email with code
- [ ] Browse movies on homepage
- [ ] Search for movies
- [ ] Like a movie
- [ ] Leave a comment with rating
- [ ] View profile
- [ ] Edit username
- [ ] Sign out

### Admin User Flow
- [ ] Sign out from any existing session
- [ ] Sign up at `/admin/signup`
- [ ] Enter admin invitation code
- [ ] Verify email with code
- [ ] Redirect to `/admin/dashboard`
- [ ] Upload a movie
- [ ] Edit movie details
- [ ] Delete a movie
- [ ] View all comments
- [ ] Delete inappropriate comments
- [ ] Configure ad settings
- [ ] Sign out

## Common Issues & Solutions

### Issue: Can't Create Second Admin
**Cause**: Maximum 2 admins allowed
**Solution**: Check database - if 2 admins exist, delete one from Prisma Studio or Neon Dashboard

### Issue: Session Exists Error
**Cause**: Already logged in with different account
**Solution**: Click "sign out first" button on auth pages

### Issue: Admin Role Not Assigned
**Cause**: Database write failed or Clerk update failed
**Solution**: 
1. Check console logs for `[v0]` error messages
2. Verify database connection
3. Check Clerk API keys in environment variables

### Issue: Can't See Database Tables
**Cause**: Connection issue or tables not created
**Solution**:
1. Run database seed: `npm run seed`
2. Check DATABASE_URL in environment variables
3. Run `npx prisma generate` then `npx prisma db push`

## Environment Variables Checklist

Ensure these are set in your Vercel project or `.env.local`:

\`\`\`env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Neon Database
DATABASE_URL=postgresql://...

# Admin Configuration
ADMIN_INVITATION_CODE=MOBIX_ADMIN_2024
\`\`\`

## Need Help?

If you're still experiencing issues:
1. Check browser console for `[v0]` logs
2. Check terminal for server errors
3. Verify all environment variables are set
4. Clear browser cache and cookies
5. Try in incognito mode
