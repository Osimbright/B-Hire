import { cache } from "react";
import { redirect } from "next/navigation";
import { PROFILE_COLS } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

/*
 * Who's signed in. The session itself is Supabase's — stored in httpOnly
 * cookies, refreshed by src/proxy.ts — so there is nothing to start or
 * encode here: `signInWithPassword()` and `signOut()` in src/actions/auth.ts
 * are what open and close it.
 */

/**
 * The signed-in user's profile, or null. Wrapped in React `cache` so the
 * layout, page and actions in one request share a single lookup.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // getClaims() verifies the JWT rather than trusting the cookie's contents.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data } = await supabase.from("profiles").select(PROFILE_COLS).eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
});

/**
 * Call at the top of every dashboard page and server action. Redirects to
 * /login when logged out, and to the user's own dashboard on a role mismatch.
 */
export async function requireProfile(role?: Role): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (role && profile.role !== role) redirect(`/dashboard/${profile.role}`);
  return profile;
}

export async function endSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
