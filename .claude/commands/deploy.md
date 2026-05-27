Deploy the current branch to Codeberg, which triggers a Railway redeploy.

Steps:
1. Run `bun run type-check` — fix any errors before committing.
2. Run `bun test` — fix any failures before committing.
3. Run `bun run build` — confirm the build passes.
4. Show `git status` and `git diff --stat` — summarise what will be committed.
5. Ask the user to confirm the commit message, or use one derived from the changes.
6. Stage and commit: `git add` the relevant files (never blindly `git add -A`), then commit.
7. Push: `git push origin <current-branch>`.

Remote: https://codeberg.org/maenu/wyss-portofolio.git
Railway auto-deploys on push to the configured branch.
