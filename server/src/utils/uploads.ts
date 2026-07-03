import multer from "multer";
import { ApiError } from "./errors.js";

export const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Shared multer config for small image uploads (kept in memory). */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in IMAGE_EXTENSIONS),
});

/**
 * Verifies the file's magic bytes actually match the declared image type —
 * the client-supplied mimetype alone is trivially spoofable.
 */
export function assertImageSignature(buffer: Buffer, mimetype: string): void {
  const ok =
    (mimetype === "image/jpeg" && buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
    (mimetype === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (mimetype === "image/webp" &&
      buffer.length > 12 &&
      buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
      buffer.subarray(8, 12).toString("latin1") === "WEBP");

  if (!ok) {
    throw ApiError.badRequest("File content doesn't match its image type", "invalid_image");
  }
}
