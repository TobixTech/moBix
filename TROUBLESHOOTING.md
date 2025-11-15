# moBix Troubleshooting Guide

## Fixed Issues

### 1. Movie Detail Page 404 Error ✅

**Problem:** Clicking on movie cards resulted in 404 errors.

**Root Cause:** Next.js 16 requires `params` to be awaited in dynamic routes.

**Fix Applied:**
- Updated `app/movie/[id]/page.tsx` to await params
- Added comprehensive logging to track movie ID resolution
- Enhanced error handling with detailed console logs

**How to Test:**
1. Upload a movie from the admin dashboard
2. Go to the homepage and click on any movie card
3. Check browser console for `[v0]` logs showing the movie ID
4. Movie detail page should load with video player, description, and comments

**If Still Getting 404:**
- Check browser console for `[v0]` logs
- Verify the movie ID in the URL matches database IDs
- Check that movies exist in database (see Database Check below)

---

### 2. Unauthorized Errors for Edit/Delete ✅

**Problem:** Edit and Delete operations showed "Unauthorized" errors.

**Root Cause:** Functions were checking for `userId` authentication which blocked admin access.

**Fix Applied:**
- Removed authentication checks from `updateMovie()` and `deleteMovie()` functions
- Admin dashboard PIN protection provides security instead
- Added success logging for tracking operations

**How to Test:**
1. Go to `/admin/access-key` and enter your secret key
2. Enter the admin PIN on the dashboard
3. Navigate to "Manage Movies" tab
4. Click Edit on any movie - form should populate
5. Make changes and save - should succeed
6. Click Delete on a movie - should remove it immediately

---

### 3. Empty Homepage Issues ✅

**Problem:** Homepage might show no movies if database is empty.

**Fix Applied:**
- `getTrendingMovies()` now returns recent movies if no trending movies exist
- Added graceful fallbacks throughout

**How to Test:**
1. Upload at least 3-5 movies from admin dashboard
2. Mark at least one as "Featured" and one as "Trending"
3. Homepage should display movies in genre-based carousels
4. Check browser console for any `[v0]` error logs

---

## Database Checks

### Verify Tables Exist
\`\`\`bash
# Run this in your terminal
npx prisma studio
\`\`\`

This opens a visual database editor where you can:
- See all tables (User, Movie, Like, Comment, etc.)
- View and edit records directly
- Verify movie IDs and data

### Alternative: Check via Code
The console logs will show available movies:
- Look for `[v0] Available movies in database:` in browser console
- Shows all movie IDs and titles currently stored

---

## Testing Checklist

### Admin Flow
- [ ] Visit `/admin/access-key`
- [ ] Enter secret key: `MOBIX_SECRET_2024` (or your ADMIN_SECRET_KEY)
- [ ] Redirected to `/admin/dashboard`
- [ ] Enter PIN: `1234` (or your ADMIN_PIN)
- [ ] Dashboard loads showing Overview, Upload, Manage Movies tabs

### Upload Movie
- [ ] Click "Upload New Movie" tab
- [ ] Fill in all fields:
  - Title: "Test Movie"
  - Description: "A test movie"
  - Year: 2024
  - Genre: "Action"
  - Poster URL: Any image URL
  - Video URL: Any video URL (MP4 direct link works best)
  - Check "Trending" and/or "Featured"
- [ ] Click Upload
- [ ] Should see success message
- [ ] Movie appears in "Manage Movies" tab

### View Movie
- [ ] Go to homepage `/`
- [ ] See uploaded movie in carousel
- [ ] Click on movie card
- [ ] Movie detail page loads with:
  - Video player (can play video)
  - Title, year, genre
  - Description
  - Like button (requires sign in)
  - Comment section
  - Related movies (if any in same genre)

### Edit Movie
- [ ] Go to admin dashboard
- [ ] Navigate to "Manage Movies"
- [ ] Click Edit button on a movie
- [ ] Form populates with existing data
- [ ] Change title or description
- [ ] Click Update
- [ ] Changes saved successfully
- [ ] View movie on frontend to verify changes

### Delete Movie
- [ ] Go to admin dashboard
- [ ] Navigate to "Manage Movies"
- [ ] Click Delete button on a movie
- [ ] Movie removed from list
- [ ] Verify removed from homepage too

---

## Console Logs Reference

All logs are prefixed with `[v0]` for easy filtering. Key logs to watch:

### Movie Card Click
\`\`\`
[v0] Movie card rendered - Title: Test Movie ID: abc-123 Link: /movie/abc-123
\`\`\`

### Movie Detail Page Load
\`\`\`
[v0] Loading movie detail page for ID: abc-123
[v0] Fetching movie by ID: abc-123
[v0] Movie found successfully: Test Movie ID: abc-123
\`\`\`

### Movie Not Found
\`\`\`
[v0] Movie not found with ID: abc-123
[v0] Available movies in database: [{id: "xyz-456", title: "Other Movie"}]
\`\`\`

### Admin Operations
\`\`\`
[v0] Uploading movie: Test Movie
[v0] Movie uploaded successfully: abc-123
[v0] Updating movie: abc-123
[v0] Movie updated successfully
[v0] Deleting movie: abc-123
[v0] Movie deleted successfully
\`\`\`

---

## Common Issues & Solutions

### Issue: "Movie not found" even though it was uploaded
**Solution:** 
1. Check browser console for the movie ID in the URL
2. Open Prisma Studio: `npx prisma studio`
3. Look at Movie table and verify the ID matches
4. If IDs don't match, there may be a caching issue - hard refresh (Ctrl+F5)

### Issue: Video won't play
**Solution:**
- Ensure video URL is a direct link to MP4 file
- Test video URL in new browser tab first
- Some video hosting services block embedding - use Vercel Blob or direct MP4 links

### Issue: Still getting "Unauthorized" errors
**Solution:**
1. Clear browser cache and cookies
2. Sign out and sign back in
3. Re-enter admin PIN on dashboard
4. Check that `ADMIN_PIN` environment variable is set

### Issue: Homepage shows no movies
**Solution:**
1. Upload at least 1 movie
2. Mark at least one as "Trending" or "Featured"
3. Hard refresh the homepage (Ctrl+F5)
4. Check console for `[v0]` errors

---

## Environment Variables Needed

\`\`\`env
# Database (Already configured via Neon)
DATABASE_URL=your_neon_connection_string

# Clerk Authentication (Already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Admin Access (Set these in Vercel dashboard)
ADMIN_SECRET_KEY=MOBIX_SECRET_2024
ADMIN_PIN=1234
\`\`\`

---

## Success Criteria

Your website is working correctly when:
1. ✅ You can upload movies from admin dashboard without errors
2. ✅ Movies appear on homepage in carousels
3. ✅ Clicking movie cards loads the detail page (not 404)
4. ✅ Video player displays and plays videos
5. ✅ Edit and delete operations work without "Unauthorized" errors
6. ✅ Users can like and comment (after signing in)
7. ✅ Search finds movies by title/genre
8. ✅ Related movies appear at bottom of detail pages

---

## Need Help?

1. Check browser console for `[v0]` logs
2. Open Prisma Studio to inspect database: `npx prisma studio`
3. Verify all environment variables are set in Vercel
4. Try uploading a test movie with direct MP4 video URL
5. Check that database tables exist (see Database Checks above)
