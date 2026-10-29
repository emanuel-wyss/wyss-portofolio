# Skill: rotate-secrets

## Description
Rotate ALL application secrets **programmatically** (PAYLOAD_SECRET,
DATABASE_URL, R2 keys, Cloudflare token) and update both `.env.local` and the
Railway `web` + `admin` services — **without any secret value ever passing
through the agent's context, and without manual dashboard steps**.

The script talks to each provider's API to mint new credentials itself:
- `PAYLOAD_SECRET` — generated locally (Web Crypto).
- `DATABASE_URL` — `ALTER USER … PASSWORD` on Postgres (via `Bun.sql`), URL rebuilt.
- `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` — Cloudflare API creates a new R2
  token and deletes the old one.
- `CLOUDFLARE_ACCESS_TOKEN` — rolled in place via the Cloudflare roll-token API
  (requires the token to be self-rollable; otherwise it reports and you rotate
  that one in the dashboard).

## Triggers
- A provider breach (e.g. Railway, Cloudflare) requires rotating credentials.
- Routine secret hygiene / offboarding.
- Invoked explicitly — never run automatically.

## Golden rule
**The agent must never read, request, paste, or echo a secret value.**
The script generates/fetches every new value itself — no human paste needed.

The agent's job is to *run the script*, not to handle secrets. The script:
- generates auto-generatable secrets locally (Web Crypto),
- reads externally-owned secrets from a hidden TTY prompt (no echo),
- pipes values to the Railway CLI via `--stdin` (never in argv/`ps`/history),
- writes to `.env.local` in place,
- prints only `✓`/`✗` status — never values.

Do **not**:
- `read` or `cat` `.env.local` to inspect values.
- Ask the user to paste a secret into the chat.
- Put a secret on a command line (visible in `ps` and shell history).

## Prerequisites
- Railway CLI authenticated: `bunx @railway/cli whoami` succeeds.
- A real terminal (TTY) for interactive prompts, OR one-shot env handoff
  (see below) when running non-interactively.

## Usage

```bash
# Rotate everything, interactively (run in a real terminal, not the agent):
bun run rotate-secrets

# Rotate only specific secrets:
bun run rotate-secrets --only PAYLOAD_SECRET,DATABASE_URL

# Only update .env.local (no Railway writes):
bun run rotate-secrets --no-local   # or --no-railway

# Rotate and immediately redeploy both services:
bun run rotate-secrets --deploy
```

### Dry run
```bash
bun run rotate-secrets --dry-run   # prints the plan, changes nothing
```

### What the script needs to authenticate to providers
It reads these from the current env (`.env.local`, auto-loaded by Bun):
- the **current** `DATABASE_URL` (to connect and change its own password),
- `CLOUDFLARE_ACCESS_TOKEN` + `R2_ACCOUNT_ID` (to call the Cloudflare API).

The Cloudflare token must have **API Tokens: Edit** and **R2** permissions for
the R2 + token rotations to succeed.

## Secrets handled
| Key | Source | Services | Notes |
|-----|--------|----------|-------|
| `PAYLOAD_SECRET` | generated locally | web, admin | Rotating invalidates all admin sessions/JWTs |
| `DATABASE_URL` | Postgres `ALTER USER` | web, admin | Changes the password of the current DB user |
| `R2_ACCESS_KEY_ID` | Cloudflare API | web, admin | New token; 32-char key id |
| `R2_SECRET_ACCESS_KEY` | Cloudflare API | web, admin | SHA-256 of new token value |
| `CLOUDFLARE_ACCESS_TOKEN` | Cloudflare roll API | web, admin | In-place roll; may need manual rotation for some token types |

Non-secrets (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_BASE_URL`) are not rotated.

## Steps (agent)
1. Confirm which secrets to rotate with the user.
2. Confirm Railway auth: `bunx @railway/cli whoami`.
3. Optionally preview: `bun run rotate-secrets --dry-run`.
4. Run `bun run rotate-secrets` (optionally `--only …`). The script rotates
   every targeted secret at its provider, updates `.env.local`, and sets both
   Railway services — no dashboard steps, no pasted values.
5. Deploy: `bun run rotate-secrets --deploy`, or `bun run deploy` afterwards.
6. Verify: `bunx @railway/cli status` and a `/health` check on the web service.
7. If the Cloudflare account token could not self-roll, the script says so —
   rotate just that one in the dashboard, then `bun run rotate-secrets --only
   CLOUDFLARE_ACCESS_TOKEN --no-...` is not needed; instead the user pastes it
   into `.env.local` and re-runs `--only` for Railway. (Rare.)

## Success criteria
- Script exits 0 with all targeted secrets showing `✓` for `.env.local` and
  both Railway services.
- No secret value appears anywhere in the agent transcript.
- After redeploy, both services are healthy.
