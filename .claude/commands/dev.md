Start the development environment for wyss.rocks.

Prerequisites to verify before starting:
1. `.env.local` exists with `DATABASE_URL` pointing to a running Postgres instance and a `PAYLOAD_SECRET` set.
2. If DATABASE_URL points to localhost, confirm Postgres is reachable.

Then run: `bun run dev`

This starts two processes in parallel:
- Hono API server on http://localhost:3000
- Astro dev server (typically on http://localhost:4321)

Check that both processes started without errors. Report the URLs for the site and the Payload admin panel (/admin).
