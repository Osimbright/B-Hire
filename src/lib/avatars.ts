import type { Availability } from "@/lib/types";

/*
 * Profile pictures and logos. They live in the public `avatars` Storage
 * bucket under `<user_id>/…`; storage policies let each user upload to and
 * delete from only their own folder. The browser crops and resizes a picture
 * before uploading it, so the stored file is always a small square. The size
 * cap and type list mirror supabase/migrations/20261002000000_profile_details.sql.
 */

export const AVATAR_BUCKET = "avatars";
export const AVATAR_SIZE = 512;
/** What the picker accepts before resizing; the upload itself is always WebP or JPEG. */
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
export const MAX_AVATAR_SOURCE_BYTES = 15 * 1024 * 1024;

/** The public URL of a stored picture, or null without one. */
export function avatarUrl(path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${encoded}`;
}

/** A fresh Storage path in the user's own folder. */
export function newAvatarPath(userId: string, extension: "webp" | "jpg") {
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

export const AVAILABILITY: Record<Availability, { label: string; hint: string }> = {
  available: { label: "Available for work", hint: "Taking on new projects" },
  limited: { label: "Limited availability", hint: "Open to the right project" },
  unavailable: { label: "Not available", hint: "Fully booked for now" },
};

export function isAvailability(value: string): value is Availability {
  return Object.hasOwn(AVAILABILITY, value);
}
