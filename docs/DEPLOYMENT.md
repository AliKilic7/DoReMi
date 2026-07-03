# Deployment Guide

## Requirements

- Node.js 22+
- PostgreSQL 14+
- ~500 MB disk for the seeded audio catalog (generated locally, never committed)

## Environment variables

All secrets live in environment variables. **Never commit `.env` files** — the repo's
`.gitignore` excludes them, and only `server/.env.example` (placeholders) is tracked.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | Access-token signing secret, **min 32 chars in production** |
| `JWT_REFRESH_SECRET` | ✅ | Refresh-token signing secret, **min 32 chars in production** |
| `PORT` | – | API port (default `4000`) |
| `NODE_ENV` | – | `development` \| `production` |
| `CORS_ORIGIN` | – | The web app's origin (default `http://localhost:3000`) |
| `API_URL` | – | (web build) where Next.js proxies `/api/*` (default `http://localhost:4000`) |

Generate production secrets:

```bash
openssl rand -base64 48
```

The server **validates its environment at startup** (zod) and **refuses to boot in
production** with placeholder or short JWT secrets. No secret is ever sent to the
client, logged, or embedded in the frontend bundle — the browser only ever sees
httpOnly cookies.

## Production build & run

```bash
npm ci
cp server/.env.example server/.env        # then fill in real values
npm run db:migrate                        # prisma migrate + client generation
npm run db:seed                           # optional: demo catalog + demo user
npm run build                             # server (tsc) + web (next build)

# process 1 — API
node --env-file=server/.env server/dist/index.js

# process 2 — web
cd web && npm start                       # honours API_URL at build time
```

Run both under a process manager (systemd, PM2, containers). Suggested topology:
a reverse proxy (nginx/Caddy) terminating TLS in front of the Next.js server, with
`/api/*` proxied straight to the Express API so cookies stay first-party.
`app.set("trust proxy", 1)` is already configured for correct client IPs behind
one proxy hop.

## Security posture (already configured)

- `helmet` security headers + restrictive CSP on the API; `X-Frame-Options`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy` on the web app
- Rate limiting: 30 failed auth attempts / 10 min per IP; 300 req/min general API
  (static media excluded)
- CSRF: `SameSite=Lax` httpOnly cookies **plus** an Origin check on mutating requests
- Access token 15 min / refresh token 30 days; `tokenVersion` revocation on
  password change
- Uploads: 2 MB cap, mimetype allow-list **and** magic-byte content verification;
  filenames are server-generated
- All input validated with zod; Prisma parameterises every query (no raw SQL)

## Storage

Uploads and generated audio live in `server/storage/` (gitignored). For multi-node
deployments move this directory to a shared volume, or swap the write/serve layer
for S3-compatible object storage — writes are isolated to
`server/src/utils/uploads.ts` consumers and the two static mounts in `app.ts`.

## Scaling notes

- Rate limits use the in-memory store; use a Redis store
  (`rate-limit-redis`) when running more than one API instance.
- Sessions are stateless JWTs — API instances need no shared session storage.
