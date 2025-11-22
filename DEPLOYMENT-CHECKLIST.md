# moBix Deployment Checklist

## Critical Pre-Launch Steps

### 1. Database Setup
\`\`\`bash
# Run this command to create all database tables
npx prisma db push

# Verify tables were created successfully
npx prisma studio
\`\`\`

### 2. Environment Variables (Required)
Add these to your Vercel project settings:

\`\`\`env
# Admin Access
ADMIN_PIN=1234
ADMIN_SECRET_KEY=MOBIX_SECRET_2024
ADMIN_INVITATION_CODE=MOBIX_ADMIN_2024

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Neon Database
DATABASE_URL=your_neon_connection_string
\`\`\`

### 3. Testing Checklist

#### Admin Dashboard
- [ ] Access admin dashboard at `/admin/access-key`
- [ ] Enter admin secret key to gain access
- [ ] Enter PIN (default: 1234) to unlock dashboard
- [ ] Upload a test movie with all fields:
  - Title
  - Thumbnail URL
  - Video URL (YouTube embed or direct file)
  - Download URL (optional)
  - Description
  - Genre (including Nollywood option)
  - Year
- [ ] Verify movie appears on homepage in correct genre carousel
- [ ] Test edit functionality - ensure video URL is preserved
- [ ] Test delete functionality
- [ ] Check comment moderation panel

#### User Features
- [ ] Sign up as new user
- [ ] Like a movie (both as user and guest)
- [ ] Post a comment with rating (requires sign-in)
- [ ] Search for movies
- [ ] Click movie card - verify it opens movie detail page
- [ ] Verify video plays correctly (embedded or direct)
- [ ] Test download button (if download URL provided)

#### Mobile Testing
- [ ] Test on iOS device - verify cyan color displays correctly
- [ ] Test navbar search bar - ensure it doesn't overlap content
- [ ] Verify responsive design on various screen sizes

### 4. Ad Integration (Optional)
If using Adsterra:
1. Go to Admin Dashboard → Ad Settings tab
2. Add your Adsterra codes:
   - Horizontal Ad Code (banners)
   - Vertical Ad Code (sidebars)
   - Native Ad Code (movie card ads - appears every 3rd card)
   - Button Click Ad Code (download button ads)
3. Enable/disable ads for homepage and movie pages

### 5. Post-Deployment Verification
- [ ] Visit live URL and test homepage load speed
- [ ] Upload first real movie
- [ ] Test all user flows end-to-end
- [ ] Monitor console for any errors
- [ ] Test sharing movie links (Open Graph tags)

## Common Issues & Solutions

**Issue:** "Table does not exist" error
- **Solution:** Run `npx prisma db push` to create tables

**Issue:** Admin access key not working
- **Solution:** Verify `ADMIN_SECRET_KEY` environment variable is set correctly

**Issue:** Movie detail page shows 404
- **Solution:** Check console logs for movie ID mismatch, verify database has movies

**Issue:** Cyan color not showing on iOS
- **Solution:** Already fixed with webkit CSS prefixes in globals.css

**Issue:** Search bar covers video player
- **Solution:** Already fixed with proper z-index and padding

## Success Criteria
✅ Admin can upload movies  
✅ Movies appear on homepage in correct genre sections  
✅ Users can watch, like, and comment on movies  
✅ Search functionality works  
✅ Mobile experience is smooth  
✅ Ads display correctly (if configured)  
✅ Download buttons work (if configured)

## Next Steps After Launch
1. Monitor user signups and engagement
2. Add more movies to populate all genre sections
3. Configure ad codes for monetization
4. Implement analytics tracking
5. Add more genres as needed
6. Consider implementing watchlist feature
7. Add SEO metadata for better search ranking
