# API Reference

Base URL: `/api` (proxied by the Next.js app; direct port `4000` in development).
All request/response bodies are JSON unless noted. Authenticated endpoints read the
`dm_at` (access) and `dm_rt` (refresh) httpOnly cookies. Errors share one shape:

```json
{ "error": { "code": "string", "message": "string", "issues?": [{ "path": "field", "message": "…" }] } }
```

`401` responses with an expired access token can be recovered by calling
`POST /auth/refresh` and retrying (the bundled web client does this automatically).

## Auth

| Method & path | Auth | Body / params | Notes |
| --- | --- | --- | --- |
| `POST /auth/register` | – | `displayName, email, password, remember?` | 201; sets cookies |
| `POST /auth/login` | – | `email, password, remember?` | sets cookies; generic 401 on bad credentials |
| `POST /auth/refresh` | cookie | – | rotates both tokens |
| `POST /auth/logout` | – | – | clears cookies |
| `GET /auth/me` | ✅ | – | current user incl. `settings` |

Failed auth attempts are rate limited (30 / 10 min / IP).

## Catalog (public)

| Method & path | Query | Notes |
| --- | --- | --- |
| `GET /genres` | – | genres with song counts |
| `GET /artists` | `q, sort=popular\|name, cursor, take≤50` | paginated `{ items, nextCursor }` |
| `GET /artists/:slug` | – | bio, follower count, `isFollowing` (when signed in), albums, top songs |
| `GET /albums` | `q, genre, sort=recent\|title\|popular, cursor, take` | paginated |
| `GET /albums/:slug` | – | ordered tracklist + total duration |
| `GET /songs` | `q, genre, sort=trending\|title\|recent\|duration, cursor, take` | paginated |
| `POST /songs/:id/play` | optional auth | bumps play count; records history when signed in |
| `GET /browse/home` | – | trending songs, new releases, popular artists, genres |
| `GET /search?q=` | – | grouped songs/albums/artists + ranked top result |
| `GET /audio/:file` | – | WAV stream, supports `Range` |

## Personal (all require auth)

| Method & path | Body / params | Notes |
| --- | --- | --- |
| `PATCH /me` | `displayName?, username?, bio?` | 409 when username taken |
| `PUT /me/password` | `currentPassword, newPassword` | revokes all other sessions |
| `GET /me/settings` / `PATCH /me/settings` | partial settings object | merge semantics |
| `POST /me/avatar` | multipart `avatar` (jpeg/png/webp ≤2MB) | magic bytes verified |
| `GET /me/home` | – | recently played, continue listening, followed artists, recommendations |
| `PUT /artists/:id/follow` / `DELETE …` | – | idempotent |
| `GET /me/likes` | `cursor, take` | liked songs + `likedAt` + `total` |
| `GET /me/likes/ids` | – | all liked song ids |
| `PUT /songs/:id/like` / `DELETE …` | – | idempotent |
| `GET /search/history` | – | last 10 committed queries |
| `POST /search/history` | `query` | repeat queries bump to top |
| `DELETE /search/history/:id` / `DELETE /search/history` | – | remove one / clear |

## Playlists (all require auth, owner-scoped)

| Method & path | Body | Notes |
| --- | --- | --- |
| `GET /me/playlists` | – | pinned first, then recently updated |
| `POST /me/playlists` | `name?, description?` | auto-name + gradient cover |
| `GET /playlists/:id` | – | songs in position order + total duration |
| `PATCH /playlists/:id` | `name?, description?, favorite?, pinned?` | |
| `DELETE /playlists/:id` | – | |
| `POST /playlists/:id/songs` | `songId` | `{ added: false }` on duplicates |
| `DELETE /playlists/:id/songs/:songId` | – | |
| `PUT /playlists/:id/songs` | `songIds[]` | full reorder; must match contents exactly |
| `POST /playlists/:id/cover` | multipart `cover` | magic bytes verified |

Accessing another user's playlist returns `404` (existence is not revealed).
