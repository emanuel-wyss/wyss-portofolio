# Skill: deploy

## Description
Push to Codeberg and deploy one or both Railway services (frontend + admin) based on what changed since the last deploy.

## Triggers
- When the user wants to ship changes to production
- Invoked explicitly — never run automatically

## How it works

Railway is not connected to a git host. Instead, `railway up` uploads source directly to Railway, which builds it using Nixpacks and deploys it.

There are **two Railway services**:

| Service | Deploy command | Source | Health check |
|---------|---------------|--------|-------------|
| **web** (frontend + API) | `bun run deploy:fe` | repo root | `GET /health` |
| **admin** (Payload CMS) | `bun run deploy:admin` | `admin/` | `GET /admin` |

The pre-deploy gate (type-check + test + build) is run locally before upload so broken code never reaches Railway.

## Prerequisites

Railway CLI authenticated — one of:
- `RAILWAY_TOKEN` environment variable set
- Or run `bunx @railway/cli login` once to cache credentials locally

## Repository Context

**Remote:** `https://codeberg.org/maenu/wyss-portofolio.git`  
**Active branch:** `develop`  
**Railway domain (develop):** `https://web-production-3e6e0.up.railway.app` (port 8080)  
**Railway builder:** Nixpacks (configured in `railway.json` / `admin/railway.json`)

**Never deploy with:**
- `.env.local` — Nixpacks ignores `.gitignore`-listed files; confirm it is not uploaded
- Failing type-check, tests, or build

## Determining what to deploy

1. Find the last deploy commit by checking `git log` for recent deploy-related activity, or use the diff since the last push.
2. Run: `git diff --name-only <last-deploy-commit>..HEAD` (or `git diff --name-only @{push}..HEAD` if no tag exists).
3. Classify changed files:
   - Files under `admin/` → **admin** service needs deploy
   - Files under `src/`, `server/`, `astro.config.mjs`, `package.json`, `railway.json`, or root config → **web** service needs deploy
   - Shared files (e.g. root `package.json`) → **both** services need deploy
4. **Ask the user** which service(s) to deploy, presenting the detected changes as context. Offer three options:
   - **Frontend only** (`bun run deploy:fe`)
   - **Admin only** (`bun run deploy:admin`)
   - **Both** (`bun run deploy`)

If no changes are detected or classification is ambiguous, always ask the user.

## Steps

1. Run `bun run type-check` — fix all errors before continuing.
2. Run `bun test` — fix all failures before continuing.
3. Run `bun run build` — confirm the build passes locally.
4. Show `git status` — confirm no secrets or build artifacts are untracked.
5. Determine which services have changes (see above).
6. Ask the user which service(s) to deploy.
7. Push to Codeberg: `git push origin develop`.
8. Deploy the selected service(s):
   ```bash
   # Frontend only
   bun run deploy:fe
   # Admin only
   bun run deploy:admin
   # Both
   bun run deploy
   ```
9. Confirm with: `bunx @railway/cli status`.

## Success Criteria
- `git push` exits 0.
- `railway up` exits 0 and prints a deployment URL for each deployed service.
