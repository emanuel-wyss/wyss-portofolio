Run `bun run build` and fix every error until the build completes successfully.

The build has two stages:
1. `bun --bun astro build` — static site generation. ConnectionRefused errors during prerender are expected (Hono server not running at build time) and can be ignored as long as the stage completes with "Complete!".
2. `bun build ./server/index.ts --outdir ./dist --format esm --target bun` — server bundle.

Fix any real errors in either stage. Re-run until both stages succeed.
