---
name: migrate
description: "Generate and apply Payload CMS database migrations after schema changes."
---

# Skill: migrate

## Description
Generate and apply Payload CMS database migrations after schema changes.

## Triggers
- After adding, removing, or modifying fields in any collection under `server/payload/collections/`
- After adding a new collection to `server/payload/config.ts`

## Repository Context

**Collections:** `server/payload/collections/` — Posts, Gallery, Snippets, Media, SiteConfig.  
**Config:** `server/payload/config.ts` — registers all collections and the Postgres adapter.  
**Database:** Railway Postgres (`DATABASE_URL` in `.env.local`).

**Payload 3 migration commands** (run via `bun run payload`):
- `bun run payload migrate:create` — generates a new migration file
- `bun run payload migrate` — runs all pending migrations
- `bun run payload migrate:status` — lists applied/pending migrations

Migrations are stored in `server/payload/migrations/` (create this directory if it doesn't exist).

## Steps

1. Confirm `.env.local` has a valid `DATABASE_URL`.
2. Identify which collection files were changed.
3. Run `bun run payload migrate:create -- --name <descriptive-name>` (e.g. `add-post-tags`).
4. Read the generated migration file — verify it reflects the intended schema change.
5. Run `bun run payload migrate` to apply it.
6. Run `bun run payload migrate:status` to confirm the migration shows as applied.
7. If the migration is destructive (drop column, rename), warn the user before step 5 and ask for confirmation.

## Success Criteria
Migration applied without errors. `migrate:status` shows it as complete.
