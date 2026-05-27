# Skill: type-check

## Description
Run TypeScript type-checking across the entire repository and resolve every error.

## Triggers
- Before any commit
- After adding or modifying TypeScript/Astro files
- After updating dependencies

## Repository Context

**Tech stack:** Astro 5 (frontend, `src/`), Hono server (backend, `server/`), Payload CMS 3 (`server/payload/`).

**Key import rules:**
- Payload 3 types come from `'payload'`, not `'payload/types'`
- `buildConfig` comes from `'payload'`, not `'payload/config'`
- `postgresAdapter` uses `pool: { connectionString }`, not `url`
- Path aliases (`@/*`, `@components/*`, etc.) are defined in `tsconfig.json` without `baseUrl`

**Config:** `tsconfig.json` — strict mode, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`.

## Steps

1. Run `bun run type-check` and capture all output.
2. Group errors by file.
3. For each file with errors, read the file and understand the root cause — never guess.
4. Apply the minimal correct fix. Common patterns:
   - `TS6133` (unused): remove the import or variable, or prefix with `_` if intentionally unused
   - `TS2307` (module not found): check if the package exists in `node_modules`; update the import path or install the missing package
   - `TS2353` (unknown property): read the type definition from `node_modules` to find the correct property name
   - `TS2322` (type mismatch): align the value type to the declared interface, or adjust the interface if it's wrong
5. Re-run `bun run type-check` after each batch of fixes.
6. Repeat until output is a clean exit with no errors printed.

## Success Criteria
`bun run type-check` exits with code 0 and prints no errors.
