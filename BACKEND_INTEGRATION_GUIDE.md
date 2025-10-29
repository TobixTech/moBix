# moBix Backend Integration Guide

## Overview
moBix is a premium streaming platform frontend built with Next.js, Framer Motion, and Tailwind CSS. This guide outlines all features, database requirements, and API integration patterns for backend developers.

---

## 🎬 Frontend Features Overview

### 1. **Authentication System**
- **Login/Sign Up Modal** - Professional cinematic design with:
  - Email/Password authentication
  - Google OAuth integration
  - Remember me functionality
  - Password visibility toggle
  - Form validation
  
**API Endpoints Needed:**
\`\`\`
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google-callback
POST /api/auth/logout
POST /api/auth/refresh-token
GET /api/auth/verify
\`\`\`

### 2. **Home Page (Public & Authenticated)**
- **Hero Banner** - Featured movie with CTA buttons
- **Movie Carousels** - Multiple categories:
  - Trending Now
  - New Releases
  - Popular
  - Recommended For You
- **Search Functionality** - Real-time movie search
- **Skeleton Loaders** - Loading states for better UX
- **Lazy Loading** - Images load on demand

**API Endpoints Needed:**
\`\`\`
GET /api/movies/featured
GET /api/movies/trending
GET /api/movies/new-releases
GET /api/movies/popular
GET /api/movies/recommended?userId={id}
GET /api/movies/search?query={query}
GET /api/movies/{id}
\`\`\`

### 3. **Movie Detail Page**
- **Video Player** - Full-screen capable
- **Movie Information** - Title, description, rating, duration
- **Action Buttons** - Play, Add to Watchlist, Like, Share
- **Comments Section** - User comments with timestamps
- **Related Movies** - Sidebar with similar content
- **Ad Placements** - Strategic ad zones

**API Endpoints Needed:**
\`\`\`
GET /api/movies/{id}/details
GET /api/movies/{id}/comments
POST /api/movies/{id}/comments
GET /api/movies/{id}/related
POST /api/movies/{id}/watchlist
POST /api/movies/{id}/like
GET /api/ads/placement/{zone}
\`\`\`

### 4. **User Dashboard**
- **Profile Management** - Edit user info, avatar
- **Watchlist** - Saved movies for later
- **Liked Movies** - User's favorite content
- **Continue Watching** - Resume playback with progress
- **Watch History** - Recently viewed content

**API Endpoints Needed:**
\`\`\`
GET /api/user/profile
PUT /api/user/profile
GET /api/user/watchlist
GET /api/user/liked-movies
GET /api/user/continue-watching
GET /api/user/watch-history
POST /api/user/watch-progress
\`\`\`

### 5. **Admin Dashboard**
- **Movie Upload Form** - Add new movies with metadata
- **Manage Movies** - Edit/delete existing content
- **Ad Settings** - Configure ad placements and pricing
- **Analytics** - View platform statistics

**API Endpoints Needed:**
\`\`\`
POST /api/admin/movies/upload
PUT /api/admin/movies/{id}
DELETE /api/admin/movies/{id}
GET /api/admin/movies/list
POST /api/admin/ads/settings
GET /api/admin/analytics
\`\`\`

### 6. **Search & Discovery**
- **Real-time Search** - Instant results as user types
- **Filters** - By genre, year, rating
- **Pagination** - Load more results

**API Endpoints Needed:**
\`\`\`
GET /api/search?query={query}&limit={limit}&offset={offset}
GET /api/genres
GET /api/movies/filter?genre={genre}&year={year}&rating={rating}
\`\`\`

---

## 🗄️ Recommended Database Schema

### **Users Table**
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  username VARCHAR(100),
  avatar_url VARCHAR(500),
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);
\`\`\`

### **Movies Table**
\`\`\`sql
CREATE TABLE movies (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  poster_url VARCHAR(500),
  video_url VARCHAR(500),
  duration INT, -- in minutes
  release_date DATE,
  rating DECIMAL(3,1),
  genre VARCHAR(100),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### **Watchlist Table**
\`\`\`sql
CREATE TABLE watchlist (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);
\`\`\`

### **Likes Table**
\`\`\`sql
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);
\`\`\`

### **Comments Table**
\`\`\`sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### **Watch Progress Table**
\`\`\`sql
CREATE TABLE watch_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  progress_seconds INT,
  last_watched TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);
\`\`\`

### **Ads Table**
\`\`\`sql
CREATE TABLE ads (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  image_url VARCHAR(500),
  link VARCHAR(500),
  placement_zone VARCHAR(50), -- 'hero', 'sidebar', 'footer'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

---

## 🔌 Recommended Backend Stack

### **Database Options**
1. **PostgreSQL** (Recommended)
   - Robust, scalable, perfect for relational data
   - Use with Supabase, Neon, or self-hosted
   
2. **MongoDB** (Alternative)
   - Good for flexible schema
   - Better for document-based data

3. **Firebase/Firestore**
   - Real-time capabilities
   - Easier setup, less infrastructure

### **Storage for Media**
1. **Vercel Blob** - Recommended for Next.js projects
2. **AWS S3** - Industry standard
3. **Cloudinary** - Image optimization included
4. **Firebase Storage** - Integrated with Firebase

### **Backend Framework**
- **Node.js + Express** - Lightweight, JavaScript
- **Next.js API Routes** - Integrated with frontend
- **Python + FastAPI** - High performance
- **Go** - Ultra-fast, scalable

### **Real-time Features**
- **WebSockets** - For live comments, notifications
- **Socket.io** - Easier WebSocket management
- **Supabase Realtime** - Built-in real-time subscriptions

---

## 🔄 Real-time Integration Patterns

### **Pattern 1: REST API with Polling**
\`\`\`typescript
// Frontend - Poll every 5 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch('/api/movies/trending');
    setMovies(await response.json());
  }, 5000);
  return () => clearInterval(interval);
}, []);
\`\`\`

### **Pattern 2: WebSocket for Live Updates**
\`\`\`typescript
// Frontend - Real-time comments
useEffect(() => {
  const socket = io('https://your-backend.com');
  socket.on('new-comment', (comment) => {
    setComments(prev => [...prev, comment]);
  });
  return () => socket.disconnect();
}, []);
\`\`\`

### **Pattern 3: Server-Sent Events (SSE)**
\`\`\`typescript
// Frontend - Stream updates
useEffect(() => {
  const eventSource = new EventSource('/api/movies/stream');
  eventSource.onmessage = (event) => {
    setMovies(JSON.parse(event.data));
  };
  return () => eventSource.close();
}, []);
\`\`\`

### **Pattern 4: SWR with Revalidation**
\`\`\`typescript
// Frontend - Automatic revalidation
const { data: movies } = useSWR('/api/movies/trending', fetcher, {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 10000 // Revalidate every 10 seconds
});
\`\`\`

---

## 🔐 Security Considerations

### **Authentication**
- Use JWT tokens with refresh token rotation
- Implement CORS properly
- Validate all inputs server-side

### **Authorization**
- Check user permissions before returning data
- Implement role-based access (user, admin)
- Validate admin actions server-side

### **Data Protection**
- Hash passwords with bcrypt
- Encrypt sensitive data
- Use HTTPS only
- Implement rate limiting

### **API Security**
\`\`\`typescript
// Example: Protected route
app.get('/api/user/profile', authenticateToken, (req, res) => {
  // Only return data for authenticated user
  res.json(req.user);
});
\`\`\`

---

## 📊 API Response Format

### **Success Response**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "Movie Title",
    "rating": 8.5
  },
  "message": "Operation successful"
}
\`\`\`

### **Error Response**
\`\`\`json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect",
  "statusCode": 401
}
\`\`\`

---

## 🚀 Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Authentication system tested
- [ ] API endpoints documented
- [ ] CORS configured
- [ ] Rate limiting implemented
- [ ] Error handling in place
- [ ] Logging system set up
- [ ] SSL/HTTPS enabled
- [ ] Database backups configured
- [ ] CDN for media files configured
- [ ] Monitoring and alerts set up

---

## 📝 Example API Implementation (Node.js + Express)

\`\`\`typescript
// api/routes/movies.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get trending movies
router.get('/trending', async (req, res) => {
  try {
    const movies = await db.query(
      'SELECT * FROM movies WHERE featured = true LIMIT 10'
    );
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to watchlist (protected)
router.post('/:id/watchlist', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'INSERT INTO watchlist (user_id, movie_id) VALUES ($1, $2)',
      [req.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Added to watchlist' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
\`\`\`

---

## 🎯 Next Steps

1. **Set up database** - Choose PostgreSQL or MongoDB
2. **Implement authentication** - JWT + Google OAuth
3. **Build API endpoints** - Start with movies and search
4. **Connect frontend** - Update API calls in components
5. **Add real-time features** - WebSockets for comments
6. **Implement caching** - Redis for performance
7. **Set up monitoring** - Track errors and performance
8. **Deploy** - Use Vercel, Railway, or your preferred platform

---

## 📞 Support

For questions about integration, refer to:
- API Documentation: `/docs/api`
- Database Schema: `/docs/database`
- Authentication Flow: `/docs/auth`
