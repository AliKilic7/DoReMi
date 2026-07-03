import { Router } from "express";
import { optionalAuth } from "../../middleware/auth.js";
import * as controller from "./catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/genres", controller.getGenres);

catalogRouter.get("/artists", controller.getArtists);
catalogRouter.get("/artists/:slug", controller.getArtist);

catalogRouter.get("/albums", controller.getAlbums);
catalogRouter.get("/albums/:slug", controller.getAlbum);

catalogRouter.get("/songs", controller.getSongs);
catalogRouter.post("/songs/:id/play", optionalAuth, controller.postPlay);

catalogRouter.get("/browse/home", controller.getBrowseHome);
