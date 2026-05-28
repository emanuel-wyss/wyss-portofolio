# wyss.rocks - Personal Portfolio

A modern personal portfolio built with TanStack Router, Hono, Payload CMS, and Cloudflare R2.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TanStack Router + React + Vite |
| API server | Hono + Bun |
| CMS admin | Payload CMS 3 + Next.js 15 |
| Database | PostgreSQL (Railway managed) |
| Media storage | Cloudflare R2 |
| Hosting | Railway (two services) |
| Version control | Codeberg |

## Services

### `web` — Hono + TanStack Router frontend (wyss.rocks)
Serves the built React frontend (`dist/public`) and the custom read-only REST API.

### `admin` — Next.js + Payload (admin.wyss.rocks)
Serves the Payload CMS admin panel. Connect from any device to manage content.

## Local Development

```bash
bun install

# Start Hono API server (port 3000) + Vite/TanStack dev server (port 4321) in parallel
bun run dev

# Start Payload admin (port 3001) — in a separate terminal
cd admin && npm install && npm run generate:importmap && npm run dev
```

Environment variables needed (`.env` in repo root, `.env` in `admin/`):

```
DATABASE_URL=postgresql://localhost:5432/portfolio
PAYLOAD_SECRET=any-random-string
# R2 vars optional locally — media upload disabled without them
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=portfolio-media
R2_BASE_URL=https://r2.wyss.rocks
```

## Project Structure

```
wyss-portfolio/
├── src/                      # React + TanStack Router frontend + shared libs
│   ├── routes/               # Frontend routes
│   ├── components/
│   ├── lib/api.ts            # Fetch helpers for Hono API
│   └── styles/
├── server/
│   ├── payload/
│   │   ├── collections/      # Shared collection schemas
│   │   └── config.ts         # Payload config (lexical editor)
│   └── index.ts              # Hono server (API + static serving)
├── admin/                    # Payload CMS admin (separate Railway service)
│   ├── src/
│   │   ├── app/(payload)/    # Next.js app router — Payload routes
│   │   └── collections/      # Mirror of server/payload/collections/
│   ├── payload.config.ts
│   ├── next.config.mjs
│   └── railway.json
├── dist/
│   ├── index.js              # Compiled Hono server
│   └── public/               # Vite/TanStack static build output
├── vite.config.ts
├── railway.json              # Railway config for web service
└── package.json
```

> **Note:** `admin/src/collections/` mirrors `server/payload/collections/`. When you change a collection schema, update both.

## API Endpoints

All served by Hono at `wyss.rocks/api/`:

```
GET /api/posts
GET /api/posts/:slug
GET /api/gallery
GET /api/gallery/:slug
GET /api/snippets
GET /api/snippets/:slug
GET /api/site-config
GET /health
```

## Deployment

Both services deploy from the same repo via the Railway CLI:

```bash
bun run deploy          # deploy web + admin
bun run deploy:fe       # web only
bun run deploy:admin    # admin only
```

### Admin service env vars (set once in Railway dashboard)

```
DATABASE_URL        = same as web service
PAYLOAD_SECRET      = same as web service
R2_ACCOUNT_ID       = ...
R2_ACCESS_KEY_ID    = ...
R2_SECRET_ACCESS_KEY = ...
R2_BUCKET           = portfolio-media
R2_BASE_URL         = https://r2.wyss.rocks
```

### First deploy checklist

- [ ] Set env vars on both Railway services
- [ ] Run `bun run migrate` to apply DB migrations
- [ ] Visit `/admin` on the admin service and create your user

## Scripts

```bash
bun run dev              # Vite/TanStack + Hono in parallel
bun run build            # vite build → dist/public/ + bun build → dist/index.js
bun run start            # bun dist/index.js (production)
bun run deploy           # railway up both services
bun run migrate          # payload migrate
bun run test             # vitest
bun run type-check       # tsc --noEmit
```

## Cloudflare R2

1. Create bucket `portfolio-media` in Cloudflare dashboard
2. Generate API token with R2 read+write permissions
3. Optionally add custom domain `r2.wyss.rocks`
4. Add credentials to both Railway service env vars

## Content Management

Visit the admin service URL and log in. Collections:

- **Posts** — blog articles with rich text, SEO fields, featured image
- **Gallery** — photo albums (images stored in R2)
- **Snippets** — code snippets with language + category
- **Media** — file library
- **SiteConfig** — social links, CV PDF, site-wide SEO

---

Built with Astro, Hono, Payload CMS, and Bun.
