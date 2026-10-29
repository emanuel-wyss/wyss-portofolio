# Skill: changelog

## Description
Check recent git commits and staged/unstaged changes against `src/routes/changelog.tsx` to ensure user-facing features, visual overhauls, and major infrastructure updates are recorded on the public `/changelog` page.

## Triggers
- Before committing or deploying user-facing features (`feat`, major `refactor`, or dependency/CMS upgrades)
- When the user asks to check or update the changelog

## Steps

1. Inspect recent commits and current work:
   ```bash
   git log --oneline -15
   git status --short
   ```
2. Read `src/routes/changelog.tsx` and compare its `entries` array against recent `feat(...)` and notable `refactor(...)` / `chore(...)` changes.
3. Determine if any user-visible or architectural milestone is missing from `entries` in `src/routes/changelog.tsx`:
   - **Include:** New pages/routes, interactive theme/canvas features, CMS/Admin workflow upgrades, major dependency upgrades, layout redesigns.
   - **Skip:** Minor typo fixes, internal-only CI tweaks, or secret rotations.
4. Add concise, dated `[YYYY-MM-DD, 'Description']` entries at the top of the `entries` array in `src/routes/changelog.tsx` (newest first).
5. Run `bun run type-check` to confirm `src/routes/changelog.tsx` compiles cleanly.

## Success Criteria
- `src/routes/changelog.tsx` reflects all notable shipped milestones in reverse chronological order.
- `bun run type-check` passes.
