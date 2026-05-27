Generate and run Payload CMS database migrations.

Steps:
1. Ensure `.env.local` has a valid `DATABASE_URL`.
2. Generate migration: `bun run payload migrate:create`
3. Review the generated migration file in `server/payload/migrations/`.
4. Run the migration: `bun run payload migrate`
5. Confirm the migration applied without errors.

Use this whenever Payload collection schemas change (new fields, changed types, new collections).
