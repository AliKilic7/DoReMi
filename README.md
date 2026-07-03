# DoReMi 🎵

[![CI](https://github.com/AliKilic7/DoReMi/actions/workflows/ci.yml/badge.svg)](https://github.com/AliKilic7/DoReMi/actions/workflows/ci.yml)

A premium, Spotify-inspired music streaming web application with an original design language —
dark glassmorphism, gradient artwork, smooth micro-animations.

> **Status**: Complete (features 1–8). Landing & auth · seeded catalog with synthesized playable audio · home / search / library / album / artist / playlist / liked / profile / settings pages · full audio player with queue, shuffle, repeat, visualizer, mini & full-screen modes · likes, follows, personalized recommendations.

## Feature highlights

- **Player** — real audio playback with seek, shuffle (lossless toggle), repeat off/all/one, volume/mute, Media Session (OS media keys), a live Web-Audio visualizer, a floating **mini player** and an immersive **full-screen player** (press `F`).
- **Keyboard shortcuts** — `Space` play/pause · `←/→` seek ±5s · `Shift+←/→` prev/next · `↑/↓` volume · `M` mute · `F` full screen · `/` search.
- **Queue** — side panel with drag & drop reordering, remove, clear, add-to-queue from any song's ⋯ menu.
- **Playlists** — create/rename/delete, add/remove/reorder songs (persisted drag & drop), cover upload, favorite & pin to sidebar.
- **Likes & follows** — optimistic hearts everywhere, a Liked Songs page, artist following.
- **Personalized home** — recently played, continue listening, made-for-you albums (genre affinity), your artists, trending, new releases.
- **Search** — debounced instant results with top-result ranking and per-user search history.
- **Accessibility** — keyboard navigable, ARIA-labelled controls, visible focus rings, `prefers-reduced-motion` support.
- **Security** — helmet headers, rate limiting (failed-attempt based on auth), SameSite cookies + Origin verification, magic-byte upload validation, startup secret validation. Details in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Demo account**: `demo@doremi.dev` / `demo1234` (after `npm run db:seed`)

## Documentation

- [Deployment & environment guide](docs/DEPLOYMENT.md)
- [API reference](docs/API.md)

## Testing

```bash
npm test          # 67 unit + integration tests (vitest; API tests need Postgres running)
npm run test:e2e  # 7 Playwright browser flows (needs `npm run dev` + seeded DB)
npm run lint      # eslint, zero warnings allowed
```

Coverage: auth (register/login/refresh/logout/session revocation), catalog pagination
and filters, search + history, likes, playlist lifecycle + ownership enforcement,
upload signature rejection, player store logic (shuffle/repeat/queue editing), the
API client's refresh-and-retry behavior, plus full browser flows for every page and
player mode — including real audio playback and drag & drop.

**CI**: every push runs lint → typecheck → tests → builds against a Postgres 16
service container, then a second job builds for production, boots both servers and
runs the full Playwright E2E suite ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

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
