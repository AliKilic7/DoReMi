# DoReMi 🎵

A premium, Spotify-inspired music streaming web application with an original design language —
dark glassmorphism, gradient artwork, smooth micro-animations.

> **Status**: Features 1–4 shipped — foundation & auth, seeded music catalog with synthesized audio, app shell with home / search / library / album / artist pages, and the full audio player (queue, shuffle, repeat, seek, volume, keyboard shortcuts, visualizer).

**Demo account**: `demo@doremi.dev` / `demo1234` (after `npm run db:seed`)

## Tech stack

| Layer    | Technology                                                              |
| -------- | ----------------------------------------------------------------------- |
| Frontend | Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand · TanStack Query · Radix UI primitives |
| Backend  | Node.js · Express 5 · PostgreSQL · Prisma ORM · JWT (access + refresh cookies) |
| Tooling  | npm workspaces · tsx · ESLint                                            |

## Repository layout

```
DoReMi/
├── web/           Next.js app (UI, pages, design system)
│   └── src/
│       ├── app/          routes (landing, login, register, home…)
│       ├── components/   ui primitives · custom SVG icons · feature components
│       ├── hooks/        reusable client hooks (useAuth, …)
│       ├── lib/          api client, utils
│       ├── providers/    React Query + session bootstrap + toasts
│       ├── stores/       Zustand stores
│       └── types/        shared domain types
└── server/        Express API
    ├── prisma/           schema + migrations + seed
    └── src/
        ├── config/       env validation (zod)
        ├── lib/          prisma client
        ├── middleware/   auth guard, error handler
        ├── modules/      feature modules (auth, …)
        └── utils/        jwt, cookies, errors
```

## Getting started

Requirements: Node 22+, PostgreSQL 14+.

```bash
# 1. Install dependencies (all workspaces)
npm install

# 2. Create the database + role (once)
sudo -u postgres psql -c "CREATE USER doremi WITH PASSWORD 'doremi_dev' CREATEDB;"
sudo -u postgres createdb -O doremi doremi

# 3. Configure the API
cp server/.env.example server/.env

# 4. Apply migrations + generate the Prisma client
npm run db:migrate

# 5. Run web (:3000) + api (:4000) together
npm run dev
```

The Next.js dev server proxies `/api/*` to the Express server, so auth cookies stay first-party
and no CORS configuration is needed in the browser.

## Authentication model

- **Access token** — 15-minute JWT in an `httpOnly` cookie.
- **Refresh token** — 30-day JWT (or session-scoped when "Keep me signed in" is off), also `httpOnly`.
- The web client transparently refreshes on 401 and retries once (`web/src/lib/api.ts`).
- `User.tokenVersion` allows revoking every outstanding session server-side.

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Run API + web concurrently               |
| `npm run build`      | Production build of both workspaces      |
| `npm run db:migrate` | Apply Prisma migrations + regenerate client |
| `npm run db:seed`    | Seed the database (arrives with the library feature) |
| `npm run lint`       | Lint the web app                         |
