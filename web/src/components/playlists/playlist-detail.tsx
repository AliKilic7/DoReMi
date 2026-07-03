"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Reorder } from "framer-motion";
import { useRef, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/catalog/empty-state";
import { LikeButton } from "@/components/catalog/like-button";
import { SongRowSkeleton } from "@/components/catalog/skeletons";
import {
  CloseIcon,
  DotsIcon,
  HeartIcon,
  NoteIcon,
  PlayIcon,
  SearchIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { usePlaylist, usePlaylistMutations } from "@/hooks/use-playlists";
import { usePlay } from "@/hooks/use-play";
import { cn, formatDuration, formatTotalDuration } from "@/lib/utils";
import { useCurrentSong } from "@/stores/player-store";
import type { PlaylistDetail, SongSummary } from "@/types";

function DetailSkeleton() {
  return (
    <div className="px-3">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
        <Skeleton className="size-48 rounded-2xl" />
        <div className="w-full space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-8 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <SongRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function PlaylistSongRow({
  song,
  index,
  onPlay,
  onRemove,
}: {
  song: SongSummary;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const isCurrent = useCurrentSong()?.id === song.id;

  return (
    <Reorder.Item
      value={song}
      id={song.id}
      whileDrag={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)", zIndex: 10 }}
      className={cn(
        "group grid cursor-grab grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2 transition-colors select-none active:cursor-grabbing sm:grid-cols-[2rem_4fr_3fr_auto]",
        "hover:bg-white/6",
        isCurrent && "bg-white/4",
      )}
    >
      <div className="relative flex size-8 items-center justify-center">
        <span className="text-sm text-subtle tabular-nums group-hover:opacity-0">{index}</span>
        <button
          onClick={onPlay}
          aria-label={`Play ${song.title}`}
          className="focus-ring absolute inset-0 flex items-center justify-center rounded-lg text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <PlayIcon className="size-4" />
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="size-10 shrink-0 rounded-lg shadow" style={{ background: song.gradient }} />
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary-soft")}>
            {song.title}
          </p>
          <Link
            href={`/artist/${song.artist.slug}`}
            className="focus-ring truncate rounded text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {song.artist.name}
          </Link>
        </div>
      </div>

      <Link
        href={`/album/${song.album.slug}`}
        className="focus-ring hidden min-w-0 truncate rounded text-sm text-muted-foreground hover:text-foreground hover:underline sm:block"
      >
        {song.album.title}
      </Link>

      <div className="flex items-center gap-0.5">
        <LikeButton songId={song.id} songTitle={song.title} />
        <span className="w-10 text-right text-sm text-subtle tabular-nums">
          {formatDuration(song.durationSec)}
        </span>
        <button
          onClick={onRemove}
          aria-label={`Remove ${song.title} from playlist`}
          className="focus-ring rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

function RenameDialog({
  playlist,
  open,
  onOpenChange,
}: {
  playlist: PlaylistDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { update } = usePlaylistMutations();
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    update.mutate(
      { id: playlist.id, name: name.trim(), description: description.trim() || null },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit details</DialogTitle>
        <DialogDescription>Give your playlist a name and a mood.</DialogDescription>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Name</Label>
            <Input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="playlist-description">Description</Label>
            <Input
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              maxLength={300}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={update.isPending || !name.trim()}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PlaylistDetailView({ id }: { id: string }) {
  const { data: playlist, isPending, error, refetch } = usePlaylist(id);
  const { update, remove, removeSong, reorder, uploadCover } = usePlaylistMutations();
  const play = usePlay();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isPending) return <DetailSkeleton />;
  if (error instanceof ApiError && error.status === 404) notFound();
  if (error || !playlist)
    return (
      <EmptyState
        icon={<NoteIcon />}
        title="Couldn't load this playlist"
        description="Something went wrong while talking to the server."
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    );

  const cover = playlist.coverUrl ? `url(${playlist.coverUrl})` : playlist.gradient;

  return (
    <div className="px-3">
      {/* hero */}
      <header className="relative -mx-8 -mt-6 px-8 pt-10 pb-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-35 blur-3xl"
          style={{ background: playlist.gradient }}
        />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload playlist cover"
            className="focus-ring group relative size-44 shrink-0 overflow-hidden rounded-2xl shadow-2xl md:size-52"
            style={{ background: cover, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {uploadCover.isPending ? "Uploading…" : "Choose cover"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadCover.mutate({ id: playlist.id, file });
              e.target.value = "";
            }}
          />

          <div className="min-w-0 text-center sm:text-left">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {playlist.pinned ? "Pinned playlist" : "Playlist"}
            </p>
            <button
              onClick={() => setRenameOpen(true)}
              className="focus-ring mt-2 rounded-lg text-left"
              aria-label="Rename playlist"
            >
              <h1 className="font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
                {playlist.name}
              </h1>
            </button>
            {playlist.description && (
              <p className="mt-2 text-sm text-muted-foreground">{playlist.description}</p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              {playlist.songCount} songs
              {playlist.songCount > 0 && (
                <>
                  <span aria-hidden> · </span>
                  {formatTotalDuration(playlist.totalDurationSec)}
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* actions */}
      <div className="mt-2 flex items-center gap-3">
        {playlist.songs.length > 0 && (
          <Button
            size="lg"
            onClick={() => playlist.songs[0] && play(playlist.songs[0], playlist.songs)}
            aria-label="Play playlist"
          >
            <PlayIcon className="size-5 translate-x-px" />
            Play
          </Button>
        )}
        <button
          onClick={() => update.mutate({ id: playlist.id, favorite: !playlist.favorite })}
          aria-label={playlist.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={playlist.favorite}
          className={cn(
            "focus-ring rounded-full p-2 transition-all hover:scale-110",
            playlist.favorite ? "text-accent-pink" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <HeartIcon filled={playlist.favorite} className="size-6" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Playlist options"
            className="focus-ring rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <DotsIcon className="size-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setRenameOpen(true)}>Edit details</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
              Upload cover
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => update.mutate({ id: playlist.id, pinned: !playlist.pinned })}
            >
              {playlist.pinned ? "Unpin from sidebar" : "Pin to sidebar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
            >
              Delete playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* tracklist */}
      <div className="mt-6 pb-4">
        {playlist.songs.length === 0 ? (
          <EmptyState
            icon={<SearchIcon />}
            title="Let's find something for this playlist"
            description="Search for songs, or use “Add to playlist” from any song's ⋯ menu."
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href="/search">Search songs</Link>
              </Button>
            }
          />
        ) : (
          <Reorder.Group
            axis="y"
            values={playlist.songs}
            onReorder={(songs) =>
              reorder.mutate({ id: playlist.id, songIds: songs.map((song) => song.id) })
            }
            role="list"
            aria-label="Playlist songs"
          >
            {playlist.songs.map((song, i) => (
              <PlaylistSongRow
                key={song.id}
                song={song}
                index={i + 1}
                onPlay={() => play(song, playlist.songs)}
                onRemove={() => removeSong.mutate({ id: playlist.id, songId: song.id })}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      <RenameDialog
        key={`${playlist.name}-${playlist.description}`}
        playlist={playlist}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogTitle>Delete “{playlist.name}”?</DialogTitle>
          <DialogDescription>
            This permanently removes the playlist. The songs themselves stay in your library.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(playlist.id)}
              disabled={remove.isPending}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
