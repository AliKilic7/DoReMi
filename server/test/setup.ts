import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load ../.env (same file the dev server uses) without overriding anything
// already present in the environment (e.g. CI-provided DATABASE_URL).
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (match && process.env[match[1]!] === undefined) {
      process.env[match[1]!] = match[2]!;
    }
  }
} catch {
  // no .env — rely on the ambient environment
}
