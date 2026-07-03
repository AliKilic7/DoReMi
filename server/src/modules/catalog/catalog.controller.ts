import type { Request, Response } from "express";
import { listAlbumsSchema, listArtistsSchema, listSongsSchema } from "./catalog.schemas.js";
import * as catalog from "./catalog.service.js";

export async function getGenres(_req: Request, res: Response): Promise<void> {
  res.json({ items: await catalog.listGenres() });
}

export async function getArtists(req: Request, res: Response): Promise<void> {
  res.json(await catalog.listArtists(listArtistsSchema.parse(req.query)));
}

export async function getArtist(req: Request, res: Response): Promise<void> {
  res.json({ artist: await catalog.getArtistBySlug(String(req.params.slug), req.userId) });
}

export async function getAlbums(req: Request, res: Response): Promise<void> {
  res.json(await catalog.listAlbums(listAlbumsSchema.parse(req.query)));
}

export async function getAlbum(req: Request, res: Response): Promise<void> {
  res.json({ album: await catalog.getAlbumBySlug(String(req.params.slug)) });
}

export async function getSongs(req: Request, res: Response): Promise<void> {
  res.json(await catalog.listSongs(listSongsSchema.parse(req.query)));
}

export async function postPlay(req: Request, res: Response): Promise<void> {
  await catalog.trackPlay(String(req.params.id), req.userId);
  res.json({ ok: true });
}

export async function getBrowseHome(_req: Request, res: Response): Promise<void> {
  res.json(await catalog.browseHome());
}
