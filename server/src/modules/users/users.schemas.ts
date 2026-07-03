import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(50).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "Username: 3–24 lowercase letters, numbers or underscores")
    .optional(),
  bio: z.string().trim().max(200).nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128),
});

export const settingsSchema = z
  .object({
    language: z.enum(["en", "tr", "es", "de", "fr"]),
    audioQuality: z.enum(["data-saver", "normal", "high", "lossless"]),
    autoplay: z.boolean(),
    notifyNewMusic: z.boolean(),
    notifyProduct: z.boolean(),
    showActivity: z.boolean(),
    personalizedRecs: z.boolean(),
  })
  .partial();

export type UserSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Required<UserSettings> = {
  language: "en",
  audioQuality: "high",
  autoplay: true,
  notifyNewMusic: true,
  notifyProduct: false,
  showActivity: true,
  personalizedRecs: true,
};
