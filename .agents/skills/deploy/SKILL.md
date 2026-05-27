# Skill: deploy

## Description
Push to Codeberg and deploy the current branch to Railway by uploading source directly via the Railway CLI.

## Triggers
- When the user wants to ship changes to production
- Invoked explicitly — never run automatically

## How it works

Railway is not connected to a git host. Instead, `railway up` uploads the current working directory directly to Railway, which builds it using Nixpacks (auto-detected from `bun.lock`) and deploys it.

The pre-deploy gate (type-check + test + build) is run locally before upload so broken code never reaches Railway.

## Prerequisites

Railway CLI authenticated — one of:
- `RAILWAY_TOKEN` environment variable set
- Or run `bunx @railway/cli login` once to cache credentials locally

## Repository Context

**Remote:** `https://codeberg.org/maenu/wyss-portofolio.git`  
**Active branch:** `develop`  
**Railway builder:** Nixpacks (configured in `railway.json`)  
**Start command:** `bun dist/index.js`  
**Health check:** `GET /health`

**Never deploy with:**
- `.env.local` — Nixpacks ignores `.gitignore`-listed files; confirm it is not uploaded
- Failing type-check, tests, or build

## Steps

1. Run `bun run type-check` — fix all errors before continuing.
2. Run `bun test` — fix all failures before continuing.
3. Run `bun run build` — confirm the build passes locally.
4. Show `git status` — confirm no secrets or build artifacts are untracked.
5. Push to Codeberg: `git push origin develop`.
6. Upload and deploy to Railway:
   ```bash
   bunx @railway/cli up --detach
   ```
7. Confirm with: `bunx @railway/cli status` — wait for deploy status to show as `SUCCESS`.

## Success Criteria
- `git push` exits 0.
- `railway up` exits 0 and prints a deployment URL.
- `/health` on the Railway domain returns `{"status":"ok"}`.
