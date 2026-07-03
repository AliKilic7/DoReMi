# Database Guide

PostgreSQL 16 + Prisma ORM. The schema lives in `server/prisma/schema.prisma`;
every change ships as a committed migration in `server/prisma/migrations/`.

## Quick start

```bash
docker compose up -d db     # local Postgres 16 with a persistent volume
cp server/.env.example server/.env
npm run db:migrate          # apply migrations + generate the Prisma client
npm run db:seed             # demo catalog (destructive — guarded in production)
```

Without Docker, any Postgres 14+ works — point `DATABASE_URL` at it.

## Schema overview

```
User ─┬─< Playlist ─< PlaylistSong >─ Song >─ Album >─ Artist
      ├─< Like >──────────────────────┘         │
      ├─< FollowArtist >────────────────────────┘
      ├─< PlayHistory >─ Song            Genre ─< Song / Album
      └─< SearchHistory
```

- **User** — auth (`passwordHash`, `tokenVersion` for session revocation) + `settings` JSON.
- **Artist / Album / Song / Genre** — the catalog. Artwork is a CSS gradient string;
  audio is a file path served by the API.
- **Playlist / PlaylistSong** — owner-scoped; `position` keeps track order,
  `(playlistId, songId)` is unique.
- **Like / FollowArtist** — composite-key join tables.
- **PlayHistory / SearchHistory** — feed the personalized home and search UX.

All relations from `User` cascade on delete, so removing an account removes its data.

## Indexing strategy

| Index | Serves |
| --- | --- |
| `songs(playCount DESC)`, `artists(monthlyListeners DESC)`, `albums(releaseDate DESC)` | trending / popular / new-release sorts |
| `playlist_songs(playlistId, position)` | ordered tracklists |
| `likes(userId, createdAt DESC)`, `play_history(userId, playedAt DESC)`, `search_history(userId, createdAt DESC)` | per-user timelines |
| **`pg_trgm` GIN** on `songs.title`, `albums.title`, `artists.name` | instant search (`ILIKE '%term%'`), which B-tree indexes cannot serve |

The trigram indexes require the `pg_trgm` extension — created automatically by the
`search_trgm_indexes` migration (hosted providers like RDS/Neon/Supabase all allow it).

## Migration workflow

```bash
# development — edit schema.prisma, then:
cd server && npx prisma migrate dev --name my_change

# production / CI — apply committed migrations only, never generates new ones:
npx prisma migrate deploy
```

Raw-SQL migrations (like the trigram one) are created with
`prisma migrate dev --create-only`, edited, then applied.

## Backups

```bash
npm run db:backup                                   # → backups/doremi-<UTC>.dump
npm run db:restore -- backups/doremi-<UTC>.dump     # destructive, asks first
```

`pg_dump` custom format (compressed, `--no-owner`, safe across users/hosts).
Note: uploaded covers/avatars and generated audio live on disk in
`server/storage/`, not in the database — back that directory up alongside dumps.
Schedule backups with cron or your platform's snapshot feature; test restores
regularly (the restore script is the same one used in this repo's verification).

## Connection pooling & scale

- Prisma manages a per-instance pool; size it with
  `DATABASE_URL=...&connection_limit=10` (default: CPUs × 2 + 1).
- Behind serverless or many API instances, put PgBouncer (transaction mode) in
  front and add `&pgbouncer=true` to the URL.
- The seed script refuses to run when `NODE_ENV=production` unless
  `FORCE_SEED=1` is set — it wipes the catalog by design.
