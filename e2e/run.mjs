/**
 * E2E runner. Prerequisites:
 *   1. Postgres running with the seeded database (`npm run db:seed`)
 *   2. API + web dev servers running (`npm run dev`)
 * Flows run sequentially; the runner exits non-zero on the first failure.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function reachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

if (!(await reachable(`${base}/api/health`))) {
  console.error(`✗ ${base}/api/health is not reachable — start the stack with \`npm run dev\` first.`);
  process.exit(2);
}

const flows = readdirSync(path.join(here, "flows"))
  .filter((f) => f.endsWith(".mjs"))
  .sort();

let failed = 0;
for (const flow of flows) {
  console.log(`\n▶ ${flow}`);
  const result = spawnSync("node", [path.join(here, "flows", flow)], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`✗ ${flow} failed`);
    failed++;
    break; // flows build on shared seeded state; stop at the first failure
  }
  console.log(`✓ ${flow} passed`);
}

if (failed) process.exit(1);
console.log(`\n✅ all ${flows.length} E2E flows passed`);
