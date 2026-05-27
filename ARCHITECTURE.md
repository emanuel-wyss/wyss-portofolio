# 🏗️ Architecture & System Overview

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USERS VISITING wyss.rocks                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE CDN (R2 Images)                    │
│                                                                   │
│  Serves: Photos, Videos, PDFs, etc.                             │
│  Speed: Global edge caching                                     │
│  Cost: $0-2/month                                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                RAILWAY HOSTING (Bun Docker)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            ASTRO 5 FRONTEND (Static + SSR)               │  │
│  │                                                            │  │
│  │  • Home page with hero section                           │  │
│  │  • Blog posts (/posts/[slug])                            │  │
│  │  • Photo galleries (/gallery/[slug])                     │  │
│  │  • Code snippets (/snippets/[slug])                      │  │
│  │  • About/Experience page                                 │  │
│  │  • 404 page                                              │  │
│  │                                                            │  │
│  │  Features:                                                │  │
│  │  • View Transitions API (page transitions)               │  │
│  │  • Dynamic theme system (7 weathers × 4 seasons)         │  │
│  │  • Cutting-edge CSS animations                           │  │
│  │  • Dark theme with weather effects                       │  │
│  │  • Responsive design (mobile-first)                      │  │
│  │  • SEO optimized (sitemap, robots.txt, OG tags)          │  │
│  │  • No tracking/cookies (privacy-first)                   │  │
│  └──────────────────────────────────────────────────────────┘
│                         │
│                         ▼
│  ┌──────────────────────────────────────────────────────────┐
│  │           HONO API SERVER (Node.js/Bun)                  │
│  │                                                            │
│  │  Endpoints:                                               │
│  │  • GET  /api/posts          (list all posts)             │
│  │  • GET  /api/posts/:slug    (single post)                │
│  │  • GET  /api/gallery        (list albums)                │
│  │  • GET  /api/gallery/:slug  (single album)               │
│  │  • GET  /api/snippets       (list snippets)              │
│  │  • GET  /api/snippets/:slug (single snippet)             │
│  │  • GET  /api/site-config    (settings)                   │
│  │  • GET  /health             (health check)               │
│  │                                                            │
│  │  Features:                                                │
│  │  • CORS middleware for Astro frontend                    │
│  │  • Error handling & logging                              │
│  │  • JSON responses                                        │
│  │  • Type-safe with TypeScript                             │
│  └──────────────────────────────────────────────────────────┘
│                         │
│                         ▼
│  ┌──────────────────────────────────────────────────────────┐
│  │         PAYLOAD CMS (Headless CMS)                       │
│  │                                                            │
│  │  Collections:                                             │
│  │  ├── Posts          (blog articles with SEO)             │
│  │  ├── Gallery        (photo albums)                       │
│  │  ├── Snippets       (code with syntax highlighting)      │
│  │  ├── Media          (images, PDFs, videos)               │
│  │  └── SiteConfig     (social links, CV, settings)         │
│  │                                                            │
│  │  Features:                                                │
│  │  • Web admin UI (/admin)                                 │
│  │  • Rich text editor                                      │
│  │  • Image upload to R2                                    │
│  │  • User authentication                                   │
│  │  • Webhook support                                       │
│  │  • REST API (used by Hono)                               │
│  └──────────────────────────────────────────────────────────┘
│                         │
│                         ▼
│  ┌──────────────────────────────────────────────────────────┐
│  │      POSTGRESQL DATABASE (Railway managed)               │
│  │                                                            │
│  │  Tables:                                                  │
│  │  ├── posts            (blog content)                     │
│  │  ├── gallery          (albums)                           │
│  │  ├── snippets         (code)                             │
│  │  ├── media            (file metadata)                    │
│  │  ├── site_config      (settings)                         │
│  │  └── users            (admin auth)                       │
│  │                                                            │
│  │  Features:                                                │
│  │  • Automatic daily backups                               │
│  │  • SSL encryption                                        │
│  │  • Replication (3+ copies)                               │
│  │  • Point-in-time recovery                                │
│  └──────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CODEBERG (Git Repository)                    │
│                                                                   │
│  • Source code version control                                  │
│  • CI/CD webhook triggers                                       │
│  • Open-source & privacy-friendly alternative to GitHub         │
│  • All code backed up                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Theme System Architecture

```
┌─────────────────────────────────────────────────────┐
│         THEME INITIALIZATION (ThemeProvider.astro)  │
│                                                       │
│  1. Detect current season (Jan-Dec)                 │
│  2. Check for special events (Christmas, Easter...) │
│  3. Determine time of day (daytime/nighttime)       │
│  4. Check user's weather preference (localStorage)  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  GET THEME VARIABLES (theme.ts)                     │
│                                                       │
│  Weather × Season Combinations:                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Sunny    × Spring, Summer, Autumn, Winter   │   │
│  │ Cloudy   × Spring, Summer, Autumn, Winter   │   │
│  │ Rainy    × Spring, Summer, Autumn, Winter   │   │
│  │ Foggy    × Spring, Summer, Autumn, Winter   │   │
│  │ Stormy   × Spring, Summer, Autumn, Winter   │   │
│  │ Windy    × Spring, Summer, Autumn, Winter   │   │
│  │ Snowy    × Spring, Summer, Autumn, Winter   │   │
│  │                                             │   │
│  │ Special Events (override):                  │   │
│  │ Christmas, New Year, Easter,                │   │
│  │ Valentine's Day, Halloween                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  Each combination returns:                          │
│  • 20+ CSS variables (colors, animations, etc)      │
│  • Particle count (rain drops, snowflakes, etc)     │
│  • Animation intensity (0-1.4)                      │
│  • Blur amount (0-12px)                             │
│  • Shadow intensity (0-1)                           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  APPLY TO DOCUMENT (applyTheme)                     │
│                                                       │
│  Set CSS custom properties (:root variables)        │
│  Add weather class to <html>                        │
│  Trigger smooth 0.8s color transitions              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  CSS RENDERING (theme-animations.css)               │
│                                                       │
│  Weather-specific effects:                          │
│  ├── Sunny:     sunGlow animation                   │
│  ├── Cloudy:    cloudDrift animation                │
│  ├── Rainy:     rainDrop particle pattern           │
│  ├── Foggy:     fogDrift with opacity blend         │
│  ├── Stormy:    lightning flashes                   │
│  ├── Windy:     pageWind sway + leaf rotation       │
│  └── Snowy:     snowFall with sine wave drift       │
│                                                       │
│  Global effects:                                    │
│  • Radial gradients (color flow)                    │
│  • backdrop-filter blur                             │
│  • filter: hue-rotate() for nighttime               │
│  • Dynamic text-shadow based on intensity           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         VISUAL RESULT IN BROWSER                    │
│                                                       │
│  Complete theme applied with:                       │
│  • Colors matching weather/season                   │
│  • Animated visual effects                          │
│  • Smooth transitions when theme changes            │
│  • User preference persisted                        │
│  • Weather selector widget in top-right             │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Creating a Blog Post

```
You: Visit /admin
  │
  ▼
Login (authenticated user)
  │
  ▼
Click "Posts" → "Create New"
  │
  ▼
Fill form:
  • Title
  • Slug (auto-generated)
  • Excerpt
  • Rich text content
  • Featured image (upload → R2)
  • Category
  • Tags
  • SEO fields
  │
  ▼
Click "Publish"
  │
  ▼
Payload CMS saves to PostgreSQL:
  INSERT INTO posts (title, slug, excerpt, content, ...)
  │
  ▼
Image uploaded to Cloudflare R2:
  POST https://r2.wyss.rocks/featured-image-123.jpg
  │
  ▼
Database stores R2 URL reference
  │
  ▼
Hono webhook triggered (optional)
  │
  ▼
Live on website:
  GET /api/posts/my-post-slug
  ↓
  Astro fetches from Hono
  ↓
  Page renders at /posts/my-post-slug
  ↓
  Image loads from R2 CDN (fast!)
```

---

## 🔄 Request Flow

### User Visits wyss.rocks/posts/my-article

```
1. Browser requests: https://wyss.rocks/posts/my-article

2. Railway receives request (Astro server)

3. Astro router matches /posts/[slug].astro

4. Component calls: getPostBySlug('my-article')

5. API function calls: fetch('/api/posts/my-article')

6. Hono server receives request

7. Hono queries PostgreSQL:
   SELECT * FROM posts WHERE slug = 'my-article'

8. Database returns:
   {
     id: '123',
     title: 'My Article',
     content: '<html>...',
     featured_image: 'https://r2.wyss.rocks/image.jpg',
     ...
   }

9. Hono returns JSON response to Astro

10. Astro renders HTML component with data

11. CSS applies dynamic theme variables

12. JavaScript initializes theme animations

13. Browser loads featured image from R2 CDN

14. User sees beautiful, themed article ✨
```

---

## 🎯 Technology Layers

```
┌──────────────────────────────────────────────┐
│          Presentation Layer (Browser)        │
├──────────────────────────────────────────────┤
│  HTML5 • CSS3 • JavaScript (minimal)         │
│  • Semantic HTML                             │
│  • CSS Variables + Animations                │
│  • View Transitions API                      │
│  • Web APIs (fetch, localStorage)            │
└──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│       Rendering Layer (Astro + Hono)         │
├──────────────────────────────────────────────┤
│  • Astro: Static generation + SSR            │
│  • Hono: Ultra-lightweight API framework     │
│  • TypeScript: Full type safety              │
│  • Bun: Fast JavaScript runtime              │
└──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│      CMS Layer (Payload)                     │
├──────────────────────────────────────────────┤
│  • Headless CMS (no presentation)            │
│  • REST API + Admin UI                       │
│  • Content Collections (5 types)             │
│  • User authentication                       │
│  • Webhook support                           │
└──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│      Data Layer (PostgreSQL)                 │
├──────────────────────────────────────────────┤
│  • Relational database                       │
│  • ACID compliance                           │
│  • Full-text search                          │
│  • JSON/JSONB support                        │
│  • Automatic backups                         │
└──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│      Storage Layer (Cloudflare R2)           │
├──────────────────────────────────────────────┤
│  • S3-compatible object storage              │
│  • Global CDN for fast delivery               │
│  • Image resizing (4 variants)                │
│  • Encryption at rest                        │
│  • 99.99% durability                         │
└──────────────────────────────────────────────┘
```

---

## 🚀 Deployment Pipeline

```
Developer writes code
         │
         ▼
Commit to Codeberg
         │
         ▼
Push to main branch
         │
         ▼
Railway webhook triggered
         │
         ▼
Docker build starts:
  • Install dependencies (bun install)
  • Build Astro (astro build)
  • Compile Hono server
  • Create optimized image
         │
         ▼
Docker push to Railway registry
         │
         ▼
New container deployment:
  • Stop old container
  • Start new container
  • Health check (GET /health)
  • Verify response
         │
         ▼
DNS points to container
         │
         ▼
Live on wyss.rocks ✅
         │
         ▼
Users see new version
```

---

## 📈 Performance Stack

```
Optimization Layer                    Benefit
─────────────────────────────────────────────────
Astro static generation      → Pre-rendered HTML (instant)
Bun runtime                  → 5x faster than Node
Cloudflare R2 CDN            → Global image delivery
CSS-only animations          → GPU acceleration
@property animations         → Smooth color transitions
View Transitions API         → Native page transitions
PostgreSQL indexes           → Fast queries
Railway auto-scaling         → Handles traffic spikes
No JavaScript runtime        → Lightweight bundle
```

---

## 🔐 Security Stack

```
Layer                         Implementation
──────────────────────────────────────────────────────
SSL/TLS                       → HTTPS automatic (Let's Encrypt)
Authentication                → Payload built-in
Authorization                 → Role-based access control
Input validation              → TypeScript type checking
CORS                          → Restricted to wyss.rocks
CSRF protection               → Payload security
SQL injection                 → ORM (Payload) prevents
XSS protection                → Content sanitization
Rate limiting                 → Optional on endpoints
Backups                       → Daily automatic (Railway)
Encryption at rest            → PostgreSQL + R2
Privacy                       → No tracking, no cookies
```

---

## 📚 File Organization Strategy

```
Feature-based organization:
┌── src/
│   ├── pages/              (route-per-file)
│   ├── components/         (reusable UI pieces)
│   ├── layouts/            (page templates)
│   ├── lib/                (utilities & logic)
│   └── styles/             (global + theme CSS)
│
├── server/                 (all backend logic)
│   ├── payload/            (CMS configuration)
│   └── index.ts            (API server)
│
├── .storybook/             (component docs)
│
└── public/                 (static assets)
```

Benefits:
- Clear separation of concerns
- Easy to locate files
- Scalable as project grows
- Standard Astro + Node.js structure

---

## 🎓 Learning Path

```
Beginner → Intermediate → Advanced
───────────────────────────────────

1. Setup (QUICK_START.md)
   ✓ Local dev environment
   ✓ Database basics
   ✓ Create first post

2. Customization (README.md)
   ✓ Modify theme colors
   ✓ Add new pages
   ✓ API usage

3. Theme System (THEME_SYSTEM.md)
   ✓ Understand CSS variables
   ✓ Modify animations
   ✓ Add weather type

4. Advanced (Source code)
   ✓ Extend Payload collections
   ✓ Add API endpoints
   ✓ Optimize performance

5. Deployment
   ✓ Configure Railway
   ✓ Setup R2 storage
   ✓ Custom domain
   ✓ Monitoring
```

---

**This is your complete system architecture!** 🏗️

Everything is connected, optimized, and ready to scale. 🚀
