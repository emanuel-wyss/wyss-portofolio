# Skill: commit

## Description
Validate the codebase, commit using conventional commit format, and push to the remote.

## Triggers
- When the user wants to commit and push changes
- Replaces ad-hoc `git add / commit / push` sequences

## Conventional Commit Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**
| Type | When to use |
|------|-------------|
| `feat` | New feature or content type |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | CSS, formatting, no logic change |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `chore` | Build process, dependencies, config |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `revert` | Reverts a previous commit |

**Scopes for this repo:**
| Scope | Covers |
|-------|--------|
| `cms` | `server/payload/` — collections, config, migrations |
| `api` | `server/index.ts` — Hono routes |
| `ui` | `src/components/`, `src/layouts/`, `src/styles/` |
| `pages` | `src/pages/` |
| `theme` | `src/lib/theme.ts`, `src/styles/theme-animations.css` |
| `lib` | `src/lib/` (excluding theme) |
| `config` | `astro.config.mjs`, `tsconfig.json`, `package.json`, etc. |
| `deploy` | `Dockerfile`, `railway.json` |
| `agents` | `.agents/` |

Scope is optional but preferred. Omit it only when a change is truly cross-cutting.

**Examples:**
```
feat(cms): add Projects collection with slug and tech-stack fields
fix(api): return 404 instead of 500 when post not found
chore(config): update payload and storage-s3 to 3.85.0
docs: update QUICK_START with Railway Postgres instructions
refactor(theme): change particle-count type to string in ThemeVariables
```

## Pre-commit Gate

Run these in order and fix any failures before proceeding:

1. `bun run type-check` — see `.agents/skills/type-check/SKILL.md`
2. `bun test` — see `.agents/skills/test/SKILL.md`
3. `bun run build` — see `.agents/skills/build/SKILL.md`

Do not commit if any step fails.

## Steps

1. Run the pre-commit gate (all three checks above).
2. Run `git diff --stat` and `git status` — understand what changed.
3. Derive or confirm the commit message:
   - If the user provided a message, validate it matches conventional format; suggest a correction if not.
   - If not provided, propose one based on the diff and ask the user to confirm.
4. Stage only the files relevant to this change. Never use `git add -A` or `git add .`.
   - Check `git status` for untracked files that should NOT be committed (secrets, build output, local config).
5. Commit:
   ```bash
   git commit -m "<type>(<scope>): <description>"
   ```
   For multi-line messages use a heredoc.
6. Push: `git push origin <current-branch>`.
7. Confirm with the output of `git log --oneline -3`.

## Repository Context

**Remote:** `https://codeberg.org/maenu/wyss-portofolio.git`  
**Active branch:** `develop`

**Never commit:**
- `.env.local` or any `.env*` file
- `dist/`, `node_modules/`, `.astro/`
- `.claude/settings.local.json`

## Success Criteria
- Pre-commit gate passes (type-check, test, build all clean).
- Commit message follows conventional format.
- `git push` exits 0.
- Commit appears in `git log`.
