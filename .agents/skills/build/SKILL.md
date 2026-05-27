# Skill: build

## Description
Run the full production build pipeline and fix any errors.

## Triggers
- Before pushing to Codeberg (Railway builds on push)
- After significant code changes
- To verify a feature is production-safe

## Repository Context

**Two-stage build** (`bun run build`):

**Stage 1 — Astro static site** (`bun --bun astro build`):
- Output: `dist/` (HTML, assets)
- Config: `astro.config.mjs`, `output: "static"`
- Expected noise: `ConnectionRefused` errors for API calls to `localhost:3000` during prerender — the Hono server isn't running at build time; `catch` blocks handle this gracefully with empty data. These are **not errors**.
- Real errors: CSS/JS compilation failures, missing components, broken imports.

**Stage 2 — Hono server bundle** (`bun build ./server/index.ts --outdir ./dist --format esm --target bun`):
- Output: `dist/index.js` (~4–5 MB)
- Must use `--target bun` — server code uses Node/Bun builtins
- Entry: `server/index.ts` → imports `server/payload/config.ts` → imports all collections

## Steps

1. Run `bun run build` and capture all output.
2. Ignore `ConnectionRefused` lines — they are expected.
3. Fix any real Astro build errors (broken imports, component errors, config issues).
4. Fix any Hono/server bundle errors.
5. Confirm Stage 1 ends with `[build] Complete!` and Stage 2 prints a bundle size.

## Success Criteria
Both stages complete without non-connection errors. `dist/index.js` exists.
