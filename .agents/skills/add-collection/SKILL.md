---
name: add-collection
description: "Add a new Payload CMS content collection with matching API routes and frontend types."
---

# Skill: add-collection

## Description
Add a new Payload CMS content collection with matching API routes and frontend types.

## Triggers
- When the user wants a new content type (e.g. projects, testimonials, events)

## Repository Context

**Pattern** — follow the existing collections exactly:

`server/payload/collections/Posts.ts` — reference implementation:
```ts
import { CollectionConfig } from 'payload';
export const Posts: CollectionConfig = { slug: '...', admin: { useAsTitle: '...' }, fields: [...] };
```

**Registration:** `server/payload/config.ts` — add to the `collections` array.

**API routes:** `server/index.ts` — add `GET /api/<slug>` and `GET /api/<slug>/:id-or-slug` using the same `payload.find()` pattern.

**Frontend types:** `src/lib/api.ts` — add the TypeScript interface and fetch function following the existing pattern (`getPosts`, `getAlbums`, etc.).

**Field types available in Payload 3:** `text`, `textarea`, `richText`, `number`, `date`, `select`, `array`, `group`, `relationship`, `upload`.

## Steps

1. Ask the user: collection name (slug), fields needed, any relationships to `media`.
2. Create `server/payload/collections/<Name>.ts` following the Posts pattern.
3. Register it in `server/payload/config.ts` — import and add to `collections` array.
4. Add list and detail routes in `server/index.ts`.
5. Add the TypeScript interface and fetch functions in `src/lib/api.ts`.
6. Run `/type-check` skill to verify no errors.
7. Run `/migrate` skill to create and apply the database migration.
8. Run `/test` skill — add a test for the new fetch function if one doesn't exist.

## Success Criteria
Type-check passes. Migration applied. New collection visible in Payload admin at `/admin`.
