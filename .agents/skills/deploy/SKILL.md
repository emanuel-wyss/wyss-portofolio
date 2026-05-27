# Skill: deploy

## Description
Validate, commit staged changes, and push to Codeberg to trigger a Railway redeploy.

## Triggers
- When the user wants to ship changes to production
- Invoked explicitly — never run automatically

## Repository Context

**Remote:** `https://codeberg.org/maenu/wyss-portofolio.git`  
**Working branch:** `develop`  
**Railway** auto-deploys on push to the configured branch.

**Never commit:**
- `.env.local` (in `.gitignore`)
- `.env` or any file containing secrets
- `dist/` (build output)
- `node_modules/`
- `.astro/` (generated types)
- `.claude/settings.local.json`

## Steps

1. Run `/type-check` skill — fix all TS errors first.
2. Run `/test` skill — fix all test failures first.
3. Run `/build` skill — confirm build passes.
4. Run `git status` and `git diff --stat` — show the user a summary of what will be committed.
5. Ask the user to confirm or provide a commit message. Write one if they don't.
6. Stage only the relevant files by name — never `git add -A` or `git add .`.
7. Commit with the confirmed message.
8. Run `git push origin develop`.
9. Confirm push succeeded. Remind the user to check the Railway dashboard for deploy status.

## Success Criteria
`git push` exits with code 0. The commit appears on Codeberg.
