# wyss.rocks - Personal Portfolio

A modern, production-ready personal portfolio built with Astro, Hono, Payload CMS, and Cloudflare R2. Features advanced animations, SEO optimization, and structured data for all content types.

## 🚀 Tech Stack

### Frontend
- **Astro 5** - Static site generation with hybrid rendering
- **TypeScript** - Type-safe development
- **Framer Motion** - Advanced animations
- **CSS3** - View Transitions API for page transitions

### Backend
- **Hono** - Lightweight web framework
- **Node.js/Bun** - JavaScript runtime
- **Payload CMS** - Headless content management system
- **PostgreSQL** - Database

### Storage
- **Cloudflare R2** - Object storage for images/media
- **PostgreSQL** - Content and metadata storage

### Deployment
- **Railway** - Hosting platform with PostgreSQL addon
- **Cloudflare** - R2 storage and DNS
- **Docker** - Containerization optimized for Bun

### Development & Testing
- **Bun** - Fast JavaScript runtime (5x faster than Node)
- **Vitest** - Unit and integration testing
- **Storybook** - Component documentation and development
- **ESLint** - Code linting
- **TypeScript** - Static type checking

### Version Control
- **Codeberg** - Open-source Git hosting

## 📋 Features

- ✅ **SEO Optimized** - Meta tags, Open Graph, Twitter cards, structured data (JSON-LD)
- ✅ **Accessibility** - WCAG compliant, semantic HTML
- ✅ **No Tracking** - No cookies, no analytics, privacy-first
- ✅ **Fast Page Transitions** - Astro View Transitions API
- ✅ **Smooth Animations** - Scroll-triggered and entrance animations
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Dark Mode** - Automatic system preference detection
- ✅ **Sitemap & Robots.txt** - Auto-generated for search engines
- ✅ **Image Optimization** - Auto-resizing with R2 storage
- ✅ **Code Snippets** - Syntax highlighting ready
- ✅ **Photo Albums** - Gallery management
- ✅ **Blog Posts** - Full-featured article management
- ✅ **About/Experience** - Profile and CV download
- ✅ **Social Links** - Configurable via Payload
- ✅ **API-First** - RESTful API for all content

## 🛠️ Setup

### Prerequisites
- Bun 1.0+ or Node.js 20+
- PostgreSQL 13+
- Cloudflare account (free tier)
- Railway account (free tier)
- Codeberg account (free)

### Local Development

1. **Clone the repository**
```bash
git clone https://codeberg.org/wyss/portfolio.git
cd portfolio
```

2. **Install dependencies**
```bash
bun install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. **Setup PostgreSQL locally**
```bash
# Using Docker
docker-compose up -d postgres

# Or install locally
brew install postgresql
createdb portfolio
```

5. **Initialize Payload CMS**
```bash
bun run payload build
bun run payload migrate
```

6. **Start development server**
```bash
bun run dev
```

The dev script runs:
- Astro dev server on `http://localhost:3000`
- Hono API server on the same port with `/api` routes
- Payload admin UI on `http://localhost:3000/admin`

### Available Scripts

```bash
# Development
bun run dev              # Start dev servers (Astro + Hono)
bun run payload          # Payload CMS CLI

# Building
bun run build            # Build Astro + compile Hono server
bun run preview          # Preview production build

# Testing
bun run test             # Run tests with Vitest
bun run test:ui          # Test UI dashboard
bun run test:coverage    # Generate coverage report

# Storybook
bun run storybook        # Start Storybook dev server
bun run build:storybook  # Build Storybook

# Linting & Type Checking
bun run lint             # Run ESLint
bun run type-check       # Check TypeScript

# Payload
bun run payload          # Payload CMS CLI
```

## 📦 Project Structure

```
wyss-portfolio/
├── src/
│   ├── components/           # Astro components
│   │   ├── Footer.astro     # Footer with social links
│   │   ├── SEO.astro        # SEO meta tags
│   │   └── *.stories.ts     # Storybook stories
│   ├── layouts/
│   │   └── Layout.astro     # Main layout with transitions
│   ├── lib/
│   │   ├── api.ts           # API utility functions
│   │   └── __tests__/       # Tests
│   ├── pages/
│   │   ├── index.astro      # Home page
│   │   ├── posts/           # Blog posts
│   │   ├── gallery/         # Photo albums
│   │   ├── snippets/        # Code snippets
│   │   ├── about.astro      # About/CV page
│   │   └── 404.astro        # Not found
│   └── styles/
│       └── global.css       # Global styles
├── server/
│   ├── payload/
│   │   ├── collections/     # Payload collections
│   │   │   ├── Posts.ts
│   │   │   ├── Gallery.ts
│   │   │   ├── Snippets.ts
│   │   │   ├── Media.ts
│   │   │   └── SiteConfig.ts
│   │   └── config.ts        # Payload configuration
│   └── index.ts             # Hono server
├── .storybook/              # Storybook configuration
├── public/                  # Static assets
├── astro.config.mjs         # Astro configuration
├── tsconfig.json            # TypeScript configuration
├── package.json
├── Dockerfile               # Docker image for Railway
├── railway.json             # Railway configuration
├── vitest.config.ts         # Vitest configuration
└── README.md
```

## 🗄️ Database Schema

### Collections (Payload CMS)

1. **Posts** - Blog articles with SEO
2. **Gallery** - Photo albums with multiple images
3. **Snippets** - Code snippets with syntax highlighting
4. **Media** - Images and files with metadata
5. **SiteConfig** - Site-wide settings (social links, CV, etc.)

See `server/payload/collections/` for detailed schemas.

## 🌐 API Endpoints

All endpoints return JSON:

```
GET  /api/posts              # List all posts
GET  /api/posts/:slug        # Get single post
GET  /api/gallery            # List all albums
GET  /api/gallery/:slug      # Get single album with images
GET  /api/snippets           # List all snippets
GET  /api/snippets/:slug     # Get single snippet
GET  /api/site-config        # Get site configuration
GET  /health                 # Health check
```

## 🎨 Content Management

### Adding a Blog Post

1. Visit `http://localhost:3000/admin`
2. Login (created on first run)
3. Go to **Posts** collection
4. Click **Create New**
5. Fill in:
   - Title
   - Slug (auto-generated from title)
   - Excerpt (meta description)
   - Content (rich text)
   - Featured image
   - Category
   - Tags
   - SEO fields
6. Click **Publish**

The post automatically appears at `/posts/{slug}`

### Adding Gallery Album

1. Go to **Gallery** collection
2. Click **Create New**
3. Add title, description
4. Add images (uploaded to Cloudflare R2)
5. Order images with drag-and-drop
6. **Publish**

### Managing Site Configuration

1. Go to **SiteConfig** collection
2. Edit the single configuration document:
   - Site name
   - Tagline
   - Social links (platform, URL, icon)
   - CV/Resume PDF
   - SEO settings

## 🔐 Cloudflare R2 Setup

1. **Create R2 bucket**
   - Cloudflare Dashboard → R2
   - Create bucket: `portfolio-media`

2. **Generate API token**
   - Settings → API Tokens
   - Create token with R2 permissions
   - Copy: Account ID, Access Key, Secret Key

3. **Configure custom domain (optional)**
   - R2 → Domains
   - Add `r2.wyss.rocks` CNAME
   - Point to your R2 domain

4. **Add to Railway**
   - See Deployment section

## 🚀 Deployment (Railway)

### Initial Setup

1. **Create Railway project**
   - https://railway.app
   - Create new project
   - Connect GitHub/Codeberg

2. **Add PostgreSQL**
   - Project → Add Service → Database → PostgreSQL
   - Railway auto-creates DATABASE_URL

3. **Set environment variables**
   - Railway dashboard → Variables
   ```
   DATABASE_URL        = [auto-set by Railway]
   R2_ACCOUNT_ID       = your-account-id
   R2_ACCESS_KEY_ID    = your-key-id
   R2_SECRET_ACCESS_KEY = your-secret-key
   R2_BUCKET           = portfolio-media
   R2_BASE_URL         = https://r2.wyss.rocks
   PAYLOAD_SECRET      = generate-random-secret
   NODE_ENV            = production
   ```

4. **Configure custom domain**
   - Project Settings → Domains
   - Add `wyss.rocks`
   - Update DNS CNAME to Railway URL

5. **Deploy**
   - Push to Codeberg main branch
   - Railway auto-builds and deploys

### Deployment Flow

```
Git push to Codeberg
         ↓
Railway webhook triggered
         ↓
Docker build (Bun optimized)
         ↓
Install dependencies
         ↓
Build Astro + Hono
         ↓
Start server
         ↓
Health check
         ↓
Live on wyss.rocks
```

## 🧪 Testing

### Unit Tests
```bash
bun run test
```

### Test Coverage
```bash
bun run test:coverage
```

### Test Files
- `src/lib/__tests__/api.test.ts` - API function tests
- Create more tests in `__tests__` folders

### Example Test
```typescript
import { describe, it, expect } from 'vitest';
import { getPosts } from '@/lib/api';

describe('getPosts', () => {
  it('should fetch posts', async () => {
    const posts = await getPosts();
    expect(Array.isArray(posts)).toBe(true);
  });
});
```

## 📚 Storybook

Start Storybook:
```bash
bun run storybook
```

Access at http://localhost:6006

Components with stories:
- `Footer` - Footer with social links
- Add more stories in `*.stories.ts` files

## 🔍 SEO Features

### Automatic
- ✅ Sitemap.xml generation
- ✅ Robots.txt configuration
- ✅ Open Graph meta tags
- ✅ Twitter card tags
- ✅ Structured data (JSON-LD)
- ✅ Canonical URLs
- ✅ Meta descriptions

### Per-Content
- SEO fields in Payload for each post/album/snippet
- Custom meta descriptions
- OG images
- Canonical URLs

### Check SEO
- Google Search Console
- Lighthouse audit
- Sitemap at `/sitemap-index.xml`

## 🎨 Customization

### Colors & Theme

Edit `src/layouts/Layout.astro` CSS variables:
```css
:root {
  --accent: #0066ff;
  --text-primary: #000000;
  --bg-primary: #ffffff;
  /* ... more variables */
}
```

### Fonts

Currently using **Geist** from Google Fonts. Edit `src/layouts/Layout.astro`:
```html
<link
  href="https://fonts.googleapis.com/css2?family=YourFont&display=swap"
  rel="stylesheet"
/>
```

### Animations

Powered by Framer Motion and CSS. Customize in component styles.

## 📖 Documentation

- [Astro Docs](https://docs.astro.build)
- [Hono Docs](https://hono.dev)
- [Payload Docs](https://payloadcms.com)
- [Bun Docs](https://bun.sh)
- [Railway Docs](https://docs.railway.app)

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps

# Check connection string
cat .env.local | grep DATABASE_URL
```

### R2 Upload Fails
- Verify R2 credentials in Payload config
- Check bucket name and region
- Ensure API token has R2 permissions

### Build Fails on Railway
- Check logs: Railway dashboard → Deployments
- Verify environment variables are set
- Ensure Dockerfile is valid

### Payload Admin Won't Load
- Clear browser cache
- Check server is running: `GET http://localhost:3000/health`
- Rebuild: `bun run payload build`

## 📄 License

MIT - Feel free to use this as a template!

## 🤝 Contributing

Found a bug? Have suggestions?
- Create issue on Codeberg
- Submit pull request

## 📝 Notes

- No cookie tracking (GDPR compliant)
- All data self-hosted or on privacy-friendly services
- Fully open-source tech stack
- Performance optimized for Lighthouse
- Mobile-first responsive design

---

Built with ❤️ using Astro, Hono, and Bun
