"use client";

import { useRef, useState } from "react";
import { updateAvatar } from "@/actions/profile";
import { Icon } from "@/components/icons";
import { Avatar, buttonStyles } from "@/components/ui";
import {
  AVATAR_ACCEPT,
  AVATAR_BUCKET,
  AVATAR_SIZE,
  MAX_AVATAR_SOURCE_BYTES,
  newAvatarPath,
} from "@/lib/avatars";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

/**
 * Draw the picture into a square: `cover` crops to fill it (a photo),
 * `contain` fits it inside with transparent edges (a logo).
 */
async function toSquare(file: File, fit: "cover" | "contain") {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scaleSide = fit === "cover" ? Math.min(width, height) : Math.max(width, height);
  const size = Math.min(AVATAR_SIZE, scaleSide);
  const scale = size / scaleSide;
  const w = width * scale;
  const h = height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.imageSmoothingQuality = "high";

  const draw = () => context.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  draw();
  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (webp?.type === "image/webp") {
    bitmap.close();
    return { blob: webp, extension: "webp" as const };
  }

  // Browsers that can't encode WebP: JPEG has no transparency, so use a white background.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  draw();
  bitmap.close();
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!jpeg) throw new Error("Couldn’t encode the picture");
  return { blob: jpeg, extension: "jpg" as const };
}

/** The profile picture (freelancers) or logo (clients), saved as soon as it's picked. */
export function AvatarUploader({
  userId,
  role,
  name,
  initialPath,
}: {
  userId: string;
  role: Role;
  name: string;
  initialPath: string | null;
}) {
  const [path, setPath] = useState(initialPath);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const what = role === "client" ? "logo or picture" : "profile picture";

  async function upload(file: File | undefined) {
    if (!file || busy) return;
    setError(null);
    if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
      setError("Choose a JPG, PNG, WebP, GIF or AVIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_SOURCE_BYTES) {
      setError("That image is over 15 MB. Choose a smaller one.");
      return;
    }

    setBusy("upload");
    try {
      const { blob, extension } = await toSquare(file, role === "client" ? "contain" : "cover");
      const next = newAvatarPath(userId, extension);
      const { error: uploadError } = await createClient()
        .storage.from(AVATAR_BUCKET)
        .upload(next, blob, { contentType: blob.type, upsert: false });
      if (uploadError) {
        setError(`Couldn’t upload the picture: ${uploadError.message}`);
        return;
      }
      const result = await updateAvatar(next);
      if (result.error) setError(result.error);
      else setPath(next);
    } catch {
      setError("Couldn’t read that image. Try a different file.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) return;
    setError(null);
    setBusy("remove");
    try {
      const result = await updateAvatar(null);
      if (result.error) setError(result.error);
      else setPath(null);
    } catch {
      setError("Couldn’t remove the picture — check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative">
        <Avatar name={name} src={path} size="xl" />
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/50 text-bone">
            <Icon name="clock" className="size-6 animate-pulse" />
          </span>
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm font-medium text-fg">{role === "client" ? "Logo or picture" : "Profile picture"}</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          {role === "client"
            ? "Your company logo or a photo of you. Shown to freelancers on your jobs and in messages."
            : "A clear, friendly photo of you. Profiles with a photo get noticed more."}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className={buttonStyles("primary", "sm")}
          >
            <Icon name="camera" className="size-3.5" />
            {busy === "upload" ? "Uploading…" : path ? "Change" : `Upload ${what}`}
          </button>
          {path && (
            <button type="button" onClick={remove} disabled={busy !== null} className={buttonStyles("ghost", "sm")}>
              {busy === "remove" ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-clay">
            {error}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label={`Upload ${what}`}
          onChange={(event) => {
            upload(event.target.files?.[0]);
            // Allow picking the same file again.
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
