"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState, Role } from "@/lib/types";
import { getString } from "@/lib/utils";

/*
 * Supabase Auth. Signing in sets the session cookies on the response; the
 * `profiles` row is created by the on_auth_user_created trigger from the
 * role and name passed as sign-up metadata, so the app never inserts it.
 * The trigger also copies the user's email onto the profile, and
 * on_auth_user_updated re-syncs it on every login and email change.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_LABEL: Record<Role, string> = { client: "Client", freelancer: "Freelancer" };

function isRole(value: string): value is Role {
  return value === "client" || value === "freelancer";
}

/** Only allow redirecting back into the dashboard after login. */
function safeNext(value: string) {
  return value.startsWith("/dashboard/") ? value : null;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = getString(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = getString(formData, "role");
  const fields = { email, role };

  if (!isRole(role)) return { error: "Choose whether you’re logging in as a client or a freelancer.", fields };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address.", fields };
  if (!password) return { error: "Enter your password.", fields };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { error: "That email and password don’t match an account.", fields };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account has no profile yet. Please sign up again.", fields };
  }

  // The login form asks which side you're on; don't silently ignore it.
  if (profile.role !== role) {
    await supabase.auth.signOut();
    return {
      error: `This email belongs to a ${profile.role} account. Choose “${ROLE_LABEL[profile.role as Role]}” to log in.`,
      fields,
    };
  }

  redirect(safeNext(getString(formData, "next")) ?? `/dashboard/${profile.role}`);
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = getString(formData, "full_name");
  const email = getString(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = getString(formData, "role");
  const fields = { full_name: fullName, email, role };

  if (!isRole(role)) return { error: "Choose whether you’re hiring or looking for work.", fields };
  if (!fullName) return { error: "Enter your name.", fields };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address.", fields };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", fields };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // The signup trigger reads these to build the profiles row.
    options: { data: { role, full_name: fullName } },
  });

  if (error) {
    const alreadyRegistered = error.code === "user_already_exists" || /already registered/i.test(error.message);
    return {
      error: alreadyRegistered
        ? "An account with this email already exists. Log in instead."
        : error.message,
      fields,
    };
  }

  // With "Confirm email" switched on, there's no session until the user
  // clicks the link in their inbox.
  if (!data.session) {
    return { message: `Almost there — check ${email} for a confirmation link, then log in.` };
  }

  redirect(`/dashboard/${role}`);
}

export async function logout() {
  await endSession();
  redirect("/login");
}

/** Where the reset email should send the user back to: this site's origin. */
async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Email a password-reset link. The reply is the same whether or not the
 * address has an account, so this can't be used to find out who's signed up.
 */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = getString(formData, "email").toLowerCase();
  const fields = { email };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address.", fields };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { error: "Too many reset emails were requested. Please wait a few minutes and try again.", fields };
    }
    // Don't reveal anything to the visitor, but leave a trail for whoever runs the app.
    console.error("Password reset email failed:", error.code ?? error.status, error.message);
  }

  return {
    message: `If an account exists for ${email}, we’ve sent a link to reset your password. It expires in 1 hour — check your spam folder too.`,
  };
}

/**
 * Set a new password. Runs with the short-lived session created when the user
 * opened the reset link (see src/app/auth/confirm/route.ts); signs out after.
 */
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don’t match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "This reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Choose a password different from your current one." };
    if (error.code === "weak_password") return { error: error.message };
    return { error: "We couldn’t update your password. Please request a new reset link." };
  }

  await supabase.auth.signOut();
  redirect("/login?reset=1");
}
