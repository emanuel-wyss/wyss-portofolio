# Skill: test

## Description
Run the test suite and fix every failing test.

## Triggers
- Before any commit
- After modifying source files in `src/lib/`
- After changing API routes in `server/index.ts`

## Repository Context

**Framework:** Vitest (`bun test`). Config: `vitest.config.ts`.
**Test location:** `src/lib/__tests__/api.test.ts`
**Source under test:** `src/lib/api.ts` — fetch wrapper functions for the Hono API.

**Expected console noise (not failures):**
Tests that exercise error paths call `console.error` inside the catch blocks of `api.ts`. Lines like `Error fetching posts:` or `Error fetching post:` in test output are expected and do not indicate a bug.

**Mock pattern:**
```ts
const mockFetch = vi.fn();
global.fetch = mockFetch as any;
mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ posts: [] }) });
```

## Steps

1. Run `bun test` and capture output.
2. Identify genuinely failing tests (lines starting with `✗` or `fail`).
3. For each failure, read both the test file and the source function it calls.
4. Fix the **source** (`src/lib/api.ts` or relevant file) unless the test itself is logically wrong.
5. Only modify a test if it tests behaviour that has intentionally changed.
6. Re-run `bun test` until output shows `0 fail`.

## Success Criteria
`bun test` exits with code 0 and reports `0 fail`.
