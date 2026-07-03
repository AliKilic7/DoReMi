-- Instant search runs case-insensitive "contains" queries (ILIKE '%term%')
-- against song titles, album titles and artist names. B-tree indexes can't
-- serve those; trigram GIN indexes can, keeping search fast as the catalog
-- grows beyond what a sequential scan handles comfortably.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "songs_title_trgm_idx"
  ON "songs" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "albums_title_trgm_idx"
  ON "albums" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "artists_name_trgm_idx"
  ON "artists" USING GIN ("name" gin_trgm_ops);
