# Skill: dev

## Description
Start the local development environment and verify it is working correctly.

## Triggers
- Beginning a development session
- After changing dependencies or environment variables

## Repository Context

**Entry point:** `src/dev.ts` — spawns two processes in parallel:
- Hono API server: `server/index.ts` — serves on `http://localhost:3000`
- Astro dev server: `astro dev` — serves on `http://localhost:4321` (default)

**Payload CMS** initialises on first request and connects to Postgres.

**Environment:** `.env.local` (auto-loaded by Bun, never committed).

Required variables:
```
DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db>
PAYLOAD_SECRET=<any-random-string>
NODE_ENV=development
```

Optional (R2 media — skip locally):
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_BASE_URL=
```

**Postgres options:** Railway Postgres (recommended — matches prod), or local via `brew install postgresql@16`.

## Steps

1. Verify `.env.local` exists and `DATABASE_URL` is set.
2. Test Postgres connectivity: `bun -e "const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); await c.connect(); console.log('ok'); await c.end();"` — skip if using Railway (network-dependent).
3. Run `bun run dev`.
4. Check both processes started without immediate crash.
5. Verify Hono: `curl -s http://localhost:3000/health` should return `{"status":"ok",...}`.
6. Report the URLs: site at `http://localhost:4321`, admin at `http://localhost:3000/admin`.

## Success Criteria
Both servers are running. `/health` returns 200. No startup errors in the console.
