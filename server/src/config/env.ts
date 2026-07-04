import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  /**
   * Supabase project JWT secret (Settings → API → JWT Secret). Access tokens
   * issued by Supabase Auth are HS256-signed with it; the API only verifies.
   */
  SUPABASE_JWT_SECRET: z.string().min(16),
  /** Comma-separated Invidious instance base URLs, tried in order. */
  YT_INSTANCES: z
    .string()
    .default("http://localhost:4000/mock/invidious")
    .transform((value) => value.split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean)),
  /** Dev-only: mounts a local mock Invidious instance under /mock/invidious. */
  MOCK_YT: flag(),
  /** Dev-only: enables POST /api/dev/login (mints JWTs without Supabase). */
  DEV_AUTH: flag(),
});

/** "1"/"true" → true; anything else (incl. "0"/"false"/unset) → false. */
function flag() {
  return z
    .string()
    .optional()
    .transform((value) => value === "1" || value === "true");
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

// Production hard guards: no placeholder secrets, no dev backdoors.
if (isProd) {
  if (env.SUPABASE_JWT_SECRET.includes("change_me") || env.SUPABASE_JWT_SECRET.length < 32) {
    console.error(
      "❌ SUPABASE_JWT_SECRET is a placeholder or too short (<32 chars). " +
        "Copy the real value from your Supabase project settings.",
    );
    process.exit(1);
  }
  if (env.DEV_AUTH || env.MOCK_YT) {
    console.error("❌ DEV_AUTH / MOCK_YT must not be enabled in production.");
    process.exit(1);
  }
}
