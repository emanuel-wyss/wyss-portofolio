#!/usr/bin/env bun
/**
 * rotate-secrets.ts — Rotate ALL secrets programmatically, without leaking any
 * value to the agent/terminal.
 *
 * Security properties (keep secrets out of the agent context):
 *   - Values are NEVER printed to stdout/stderr (only ✓/✗ status).
 *   - New values are generated/fetched by this script, not pasted by a human.
 *   - Values are handed to the Railway CLI via stdin (`variable set --stdin`),
 *     never on argv (so they don't show in `ps` or shell history).
 *   - .env.local is updated in place, preserving comments and order.
 *
 * What it rotates (end-to-end, no human in the loop):
 *   - PAYLOAD_SECRET        → generated locally (Web Crypto).
 *   - DATABASE_URL          → ALTER USER ... PASSWORD on Postgres, URL rebuilt.
 *   - R2_ACCESS_KEY_ID /    → Cloudflare API: create a new R2 S3 access key,
 *     R2_SECRET_ACCESS_KEY       delete the old one.
 *   - CLOUDFLARE_ACCESS_TOKEN → rolled via the Cloudflare "roll token" API
 *                               (only if the token can roll itself).
 *
 * Credentials the script needs to CALL the providers are read from the current
 * environment (which the script loads from .env.local): the existing
 * DATABASE_URL (to connect and change its own password) and a Cloudflare API
 * token with the right perms (CLOUDFLARE_ACCESS_TOKEN + R2_ACCOUNT_ID).
 *
 * Usage:
 *   bun run rotate-secrets                  # rotate everything
 *   bun run rotate-secrets --only PAYLOAD_SECRET,DATABASE_URL
 *   bun run rotate-secrets --no-railway     # only update .env.local
 *   bun run rotate-secrets --no-local       # only update Railway
 *   bun run rotate-secrets --deploy         # redeploy after rotation
 *   bun run rotate-secrets --dry-run        # show plan, change nothing
 *
 * Seeding a human-supplied value (e.g. a freshly minted Cloudflare token that
 * the script can't auto-mint because the old one is dead) WITHOUT pasting it
 * into the agent/terminal history. Set a one-shot env var in your OWN shell:
 *
 *   SEED_CLOUDFLARE_ACCESS_TOKEN='...' bun run rotate-secrets --seed CLOUDFLARE_ACCESS_TOKEN
 *
 * The value is read from SEED_<KEY>, persisted to .env.local + Railway, and
 * never printed.
 */

import { randomBytes } from "node:crypto";
import { SQL } from "bun";

const SERVICES = ["web", "admin"] as const;
const ENV_FILE = ".env.local";
const CF_API = "https://api.cloudflare.com/client/v4";

// Which Railway services receive each var.
const VAR_SERVICES: Record<string, readonly string[]> = {
  PAYLOAD_SECRET: SERVICES,
  DATABASE_URL: SERVICES,
  R2_ACCESS_KEY_ID: SERVICES,
  R2_SECRET_ACCESS_KEY: SERVICES,
  // Local-only: a management credential used solely by this script to call the
  // Cloudflare API. The app never reads it, so it must NOT live in Railway's
  // runtime env (smaller blast radius). Persisted to .env.local only.
  CLOUDFLARE_ACCESS_TOKEN: [],
};

const ALL = [
  "PAYLOAD_SECRET",
  "DATABASE_URL",
  "R2_ACCESS_KEY_ID", // rotated together with R2_SECRET_ACCESS_KEY
  "CLOUDFLARE_ACCESS_TOKEN",
] as const;

// ─── arg parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const flagValue = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const onlyList = flagValue("--only")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const doRailway = !has("--no-railway");
const doLocal = !has("--no-local");
const doDeploy = has("--deploy");
const dryRun = has("--dry-run");
const seedList = flagValue("--seed")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function selected(key: string) {
  if (!onlyList) return true;
  // R2 pair selectable by either key.
  if (key === "R2_ACCESS_KEY_ID")
    return onlyList.some((k) => k.startsWith("R2_"));
  return onlyList.includes(key);
}

// ─── low-level helpers (never log secret values) ────────────────────────────

function generateSecret(): string {
  return randomBytes(32).toString("hex"); // 64 hex chars
}

/** Set a Railway variable via stdin so the value never hits argv. */
async function setRailwayVar(service: string, key: string, value: string) {
  if (dryRun) return true;
  const proc = Bun.spawn(
    ["bunx", "@railway/cli", "variable", "set", key, "--stdin",
     "--service", service, "--skip-deploys"],
    { stdin: "pipe", stdout: "ignore", stderr: "pipe" },
  );
  proc.stdin.write(value);
  await proc.stdin.end();
  const code = await proc.exited;
  if (code !== 0) {
    const err = (await new Response(proc.stderr).text()).split("\n")[0];
    console.error(`    railway error (${service}/${key}): ${err}`);
  }
  return code === 0;
}

/** Update one KEY in .env.local, preserving everything else. */
async function updateEnvLocal(key: string, value: string) {
  if (dryRun) return;
  const file = Bun.file(ENV_FILE);
  const text = (await file.exists()) ? await file.text() : "";
  const lines = text.split("\n");
  const quoted = `"${value.replace(/"/g, '\\"')}"`;
  const re = new RegExp(`^${key}=`);
  let found = false;
  const next = lines.map((l) => (re.test(l) ? ((found = true), `${key}=${quoted}`) : l));
  if (!found) next.push(`${key}=${quoted}`);
  await Bun.write(ENV_FILE, next.join("\n"));
}

/** Persist a freshly rotated value to all its targets. Returns ok. */
async function persist(key: string, value: string): Promise<boolean> {
  let ok = true;
  if (doLocal) {
    await updateEnvLocal(key, value);
    console.log(`  ✓ ${ENV_FILE}`);
  }
  const targets = VAR_SERVICES[key] ?? SERVICES;
  if (doRailway && targets.length === 0) {
    console.log(`  - railway: skipped (local-only secret)`);
  }
  if (doRailway) {
    for (const svc of targets) {
      const r = await setRailwayVar(svc, key, value);
      console.log(`  ${r ? "✓" : "✗"} railway:${svc}`);
      ok &&= r;
    }
  }
  return ok;
}

async function cf(path: string, init?: RequestInit) {
  const token = process.env.CLOUDFLARE_ACCESS_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_ACCESS_TOKEN not set in environment");
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json()) as any;
  if (!body.success) {
    const msg = body.errors?.map((e: any) => e.message).join("; ") || res.statusText;
    throw new Error(`Cloudflare API ${res.status}: ${msg}`);
  }
  return body.result;
}

// ─── rotators ────────────────────────────────────────────────────────────

async function rotatePayloadSecret() {
  console.log("• PAYLOAD_SECRET — generating");
  if (dryRun) return true;
  return persist("PAYLOAD_SECRET", generateSecret());
}

/**
 * Rotate the Postgres password by connecting with the CURRENT DATABASE_URL and
 * running ALTER USER ... PASSWORD, then rebuilding the URL with the new pw.
 */
async function rotateDatabaseUrl() {
  console.log("• DATABASE_URL — rotating Postgres password");
  const current = process.env.DATABASE_URL;
  if (!current) {
    console.error("  ✗ DATABASE_URL not set in environment");
    return false;
  }
  const url = new URL(current);
  const user = decodeURIComponent(url.username);
  const newPw = randomBytes(24).toString("base64url"); // url-safe, no padding

  if (dryRun) {
    console.log(`  (dry-run) would ALTER USER ${user} and rebuild URL`);
    return true;
  }

  const sql = new SQL(current);
  try {
    // Identifiers can't be parameterized; user comes from our own URL, and the
    // password is passed as a quoted literal. Escape single quotes defensively.
    const safePw = newPw.replace(/'/g, "''");
    await sql.unsafe(`ALTER USER "${user.replace(/"/g, '""')}" WITH PASSWORD '${safePw}'`);
  } catch (e) {
    console.error(`  ✗ ALTER USER failed: ${(e as Error).message}`);
    await sql.end();
    return false;
  }
  await sql.end();

  url.password = encodeURIComponent(newPw);
  const newUrl = url.toString();
  console.log("  ✓ password changed on Postgres");
  return persist("DATABASE_URL", newUrl);
}

/**
 * Rotate the R2 S3 credential: create a new R2 access key via the Cloudflare
 * API, persist it, then delete the old one.
 * Docs: /accounts/{account_id}/r2/buckets ... /tokens (S3 credentials).
 */
async function rotateR2() {
  console.log("• R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY — rotating R2 credential");
  const accountId = process.env.R2_ACCOUNT_ID;
  const oldKeyId = process.env.R2_ACCESS_KEY_ID;
  if (!accountId) {
    console.error("  ✗ R2_ACCOUNT_ID not set in environment");
    return false;
  }
  if (dryRun) {
    console.log("  (dry-run) would create new R2 token + delete old");
    return true;
  }

  // Create a new account-scoped R2 API token (yields S3 access key id + secret).
  // Endpoint: POST /accounts/{account_id}/tokens with an r2 permission group.
  let result: any;
  try {
    result = await cf(`/accounts/${accountId}/tokens`, {
      method: "POST",
      body: JSON.stringify({
        name: `r2-rotated-${new Date().toISOString().slice(0, 10)}`,
        policies: [
          {
            effect: "allow",
            resources: { [`com.cloudflare.api.account.${accountId}`]: "*" },
            // "Workers R2 Storage Write" permission group.
            permission_groups: [{ id: "bf7481a1826f439697cb59a20b22293e" }],
          },
        ],
      }),
    });
  } catch (e) {
    console.error(`  ✗ create R2 token failed: ${(e as Error).message}`);
    console.error("    (verify CLOUDFLARE_ACCESS_TOKEN has 'API Tokens: Edit' + R2 perms)");
    return false;
  }

  // The S3 access key id is the token id; secret is sha256 of the token value.
  const newKeyId: string = result.id;
  const tokenValue: string = result.value;
  const hashBuf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(tokenValue),
  );
  const newSecret = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (newKeyId.length !== 32) {
    console.error(`  ✗ unexpected R2 key id length ${newKeyId.length} (expected 32)`);
    return false;
  }

  console.log("  ✓ new R2 credential created");
  const ok1 = await persist("R2_ACCESS_KEY_ID", newKeyId);
  const ok2 = await persist("R2_SECRET_ACCESS_KEY", newSecret);

  // Delete the old token only after the new one is fully persisted.
  if (ok1 && ok2 && oldKeyId && oldKeyId !== newKeyId) {
    try {
      await cf(`/accounts/${accountId}/tokens/${oldKeyId}`, { method: "DELETE" });
      console.log("  ✓ old R2 credential deleted");
    } catch (e) {
      console.error(`  ⚠ could not delete old R2 token (${(e as Error).message}); delete it manually`);
    }
  }
  return ok1 && ok2;
}

/**
 * Roll the Cloudflare account API token in place (same id, new value). Only
 * works if the token has "API Tokens: Edit" and we know its token id.
 * This is an ACCOUNT-owned token, so use /accounts/{id}/tokens/* endpoints
 * (user-owned tokens would use /user/tokens/* instead).
 */
async function rotateCloudflareToken() {
  console.log("• CLOUDFLARE_ACCESS_TOKEN — rolling token");
  if (dryRun) {
    console.log("  (dry-run) would verify + roll the current token");
    return true;
  }
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    console.error("  R2_ACCOUNT_ID not set in environment");
    return false;
  }
  let tokenId: string;
  try {
    const verify = await cf(`/accounts/${accountId}/tokens/verify`);
    tokenId = verify.id;
  } catch (e) {
    console.error(`  ⚠ cannot verify token to find its id: ${(e as Error).message}`);
    console.error("    (account tokens may need manual rotation in the Cloudflare dashboard)");
    return false;
  }
  try {
    const rolled = await cf(`/accounts/${accountId}/tokens/${tokenId}/value`, {
      method: "PUT",
      body: "{}",
    });
    const newValue: string = typeof rolled === "string" ? rolled : rolled?.value ?? rolled;
    if (!newValue || typeof newValue !== "string") {
      console.error("  ✗ roll returned no value");
      return false;
    }
    console.log("  ✓ token rolled");
    return persist("CLOUDFLARE_ACCESS_TOKEN", newValue);
  } catch (e) {
    console.error(`  ⚠ roll failed: ${(e as Error).message}`);
    console.error("    (user/account tokens may need manual rotation in the dashboard)");
    return false;
  }
}

// ─── main ─────────────────────────────────────────────────────────────────

const ROTATORS: Record<string, () => Promise<boolean>> = {
  PAYLOAD_SECRET: rotatePayloadSecret,
  DATABASE_URL: rotateDatabaseUrl,
  R2_ACCESS_KEY_ID: rotateR2,
  CLOUDFLARE_ACCESS_TOKEN: rotateCloudflareToken,
};

/** Seed human-supplied values from SEED_<KEY> env vars (never printed). */
async function seedValues(): Promise<number> {
  if (!seedList) return 0;
  let failures = 0;
  for (const key of seedList) {
    console.log(`\u2022 ${key} \u2014 seeding from SEED_${key}`);
    const value = process.env[`SEED_${key}`];
    if (!value) {
      console.error(`  \u2717 SEED_${key} not set in environment`);
      failures++;
      console.log("");
      continue;
    }
    if (!(await persist(key, value.trim()))) failures++;
    console.log("");
  }
  return failures;
}

async function main() {
  console.log(`🔐 Secret rotation${dryRun ? " (dry-run)" : ""}`);
  console.log(
    `   targets: ${[doLocal && ".env.local", doRailway && "railway(web,admin)"].filter(Boolean).join(" ")}`,
  );
  let failures = await seedValues();

  const plan = ALL.filter(selected);
  if (seedList && !onlyList) {
    // With --seed and no --only, only seed (don't auto-rotate everything).
    if (failures > 0) {
      console.error(`Completed with ${failures} failure(s).`);
      process.exit(1);
    }
    console.log("\u2705 Seeded.");
    return;
  }
  console.log(`   plan: ${plan.join(", ")}\n`);

  for (const key of plan) {
    const ok = await ROTATORS[key]();
    if (!ok) failures++;
    console.log("");
  }

  if (failures > 0) {
    console.error(`Completed with ${failures} failure(s). See messages above.`);
    process.exit(1);
  }
  console.log("✅ All targeted secrets rotated.");

  if (!dryRun && doDeploy && doRailway) {
    console.log("\n🚀 Redeploying both services…");
    const code = await Bun.spawn(["bun", "run", "deploy"], {
      stdout: "inherit", stderr: "inherit",
    }).exited;
    if (code !== 0) process.exit(code);
  } else if (!dryRun && doRailway) {
    console.log("\nℹ️  Set with --skip-deploys. Run `bun run deploy` (or --deploy) to roll out.");
  }
}

main().catch((e) => {
  console.error("Fatal:", (e as Error).message); // never prints secrets
  process.exit(1);
});
