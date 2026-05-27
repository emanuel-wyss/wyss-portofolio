# Quick Start Guide

## 5-Minute Local Setup

### 1. Clone & Install
```bash
git clone https://codeberg.org/wyss/portfolio.git
cd wyss-portfolio
bun install
```

### 2. Setup Environment
```bash
cp .env.example .env.local

# Edit .env.local:
# - DATABASE_URL=postgresql://postgres:password@localhost:5432/portfolio
# - Leave R2 keys empty for now (optional locally)
# - PAYLOAD_SECRET=your-secret-key (any random string)
```

### 3. Start PostgreSQL
```bash
# Docker (easiest)
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Or use your local PostgreSQL installation
```

### 4. Run Dev Server
```bash
bun run dev
```

Open browser:
- **Website**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API**: http://localhost:3000/api/posts

### 5. Create First Post
1. Go to http://localhost:3000/admin
2. You'll be prompted to create admin user
3. Navigate to **Posts** collection
4. Click **Create New**
5. Fill in and publish

Done! Your portfolio is running locally.

---

## 15-Minute Railway Deployment

### 1. Prepare Repository
```bash
# Make sure everything is committed
git add .
git commit -m "Initial portfolio setup"
git push origin main
```

### 2. Railway Setup
- Sign up at https://railway.app
- Create new project from Codeberg
- Select your portfolio repository

### 3. Add PostgreSQL
In Railway dashboard:
- Project → Add Service → Database → PostgreSQL
- Railway auto-creates `DATABASE_URL`

### 4. Set Environment Variables
In Railway dashboard → Variables:

```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET=portfolio-media
R2_BASE_URL=https://r2.wyss.rocks
PAYLOAD_SECRET=generate-random-secret-string
NODE_ENV=production
```

### 5. Configure Domain
In Railway → Settings → Domains:
- Add `wyss.rocks`
- Update DNS: CNAME `wyss.rocks` → `<railway-generated-domain>.railway.app`

### 6. Deploy
Push to main branch:
```bash
git push origin main
```

Railway automatically:
- Builds Docker image
- Installs dependencies
- Creates database tables
- Deploys to production
- Sets up SSL

Check deployment status in Railway dashboard → Deployments

---

## Cloudflare R2 Setup (10 minutes)

### 1. Create R2 Bucket
- Cloudflare Dashboard → R2
- Create bucket: `portfolio-media`

### 2. Generate API Token
- Settings → API Tokens
- Create token with **Read & Write** permissions
- Copy:
  - Account ID
  - Access Key ID
  - Secret Access Key

### 3. Setup Custom Domain (Optional)
- R2 → Domains
- Create custom domain: `r2.wyss.rocks`
- Point CNAME to your R2 domain

### 4. Add to Railway
Add these to Railway environment variables:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BASE_URL=https://r2.wyss.rocks`

### 5. Test Upload
- Go to `/admin` on Railway deployment
- Upload image to Posts or Gallery
- Should automatically upload to R2

---

## Complete Checklist

### Development Setup
- [ ] Clone repository
- [ ] Run `bun install`
- [ ] Setup `.env.local`
- [ ] Start PostgreSQL
- [ ] Run `bun run dev`
- [ ] Create admin user in `/admin`
- [ ] Create test post

### Local Content
- [ ] Add 2-3 blog posts
- [ ] Create gallery album with images
- [ ] Add code snippets
- [ ] Configure site settings in SiteConfig

### Railway Deployment
- [ ] Create Railway account
- [ ] Connect Codeberg repository
- [ ] Add PostgreSQL database
- [ ] Set environment variables
- [ ] Configure domain
- [ ] Deploy

### Cloudflare R2
- [ ] Create R2 bucket
- [ ] Generate API token
- [ ] Add credentials to Railway
- [ ] Test image upload

### Final Steps
- [ ] Update social links in SiteConfig
- [ ] Upload CV/Resume PDF
- [ ] Customize About page
- [ ] Add Google Search Console
- [ ] Monitor Lighthouse scores

---

## Common Issues

### "Connection refused" on localhost:3000
```bash
# Make sure dev server is running
bun run dev

# Check PostgreSQL
docker ps | grep postgres
```

### Images not uploading to R2
```bash
# Verify R2 credentials
cat .env.local | grep R2

# Check Payload logs
# Visit Payload admin → Files collection → try uploading
```

### Railway build fails
- Check Railway logs → Deployments
- Verify environment variables are set
- Try redeploying: Railway dashboard → Deploy

### Sitemap not generating
- Sitemap auto-generates after first build
- Check `/sitemap-index.xml` after deployment
- Should include all posts, galleries, snippets

---

## Next Steps

1. **Customize Design**
   - Edit colors in `src/layouts/Layout.astro`
   - Modify fonts and typography
   - Add your logo/branding

2. **Add More Pages**
   - Create new pages in `src/pages/`
   - Use Layout component for consistency
   - Add to navigation

3. **Setup Analytics (Optional)**
   - Use Plausible.io (privacy-friendly)
   - No cookies, no tracking script
   - Add to Layout head

4. **Custom Domain with SSL**
   - DNS setup complete ✓
   - Let's Encrypt SSL auto-configured ✓
   - All HTTPS ✓

5. **Monitoring**
   - Railway dashboard for server logs
   - Google Search Console for indexing
   - Lighthouse for performance

---

## Support

- **Documentation**: See README.md
- **Issues**: Create issue on Codeberg
- **API Docs**: Check `src/lib/api.ts`
- **Deployment**: Railway docs at https://docs.railway.app

---

**You're all set!** 🎉

Your portfolio is ready to go live.
