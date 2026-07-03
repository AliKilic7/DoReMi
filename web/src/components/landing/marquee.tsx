import { albumTiles, type AlbumTile } from "@/lib/mock-tiles";

function Tile({ tile }: { tile: AlbumTile }) {
  return (
    <figure className="group w-40 shrink-0">
      <div
        className="aspect-square rounded-2xl shadow-lg transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:scale-[1.03]"
        style={{ background: tile.gradient }}
      />
      <figcaption className="mt-2 px-0.5">
        <p className="truncate text-sm font-medium">{tile.title}</p>
        <p className="truncate text-xs text-subtle">{tile.artist}</p>
      </figcaption>
    </figure>
  );
}

/** Infinite scrolling shelf of fictional album covers. */
export function AlbumMarquee() {
  const row = [...albumTiles, ...albumTiles];
  return (
    <section id="discover" aria-label="Featured albums" className="relative py-16">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-background to-transparent" />

      <div className="overflow-hidden">
        <div className="animate-marquee flex w-max gap-6 hover:[animation-play-state:paused]">
          {row.map((tile, i) => (
            <Tile key={`${tile.title}-${i}`} tile={tile} />
          ))}
        </div>
      </div>
    </section>
  );
}
