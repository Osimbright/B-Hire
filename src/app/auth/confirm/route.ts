import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Supabase's emailed links land (password reset today). Turns the link
 * into a session cookie, then sends the user on to `next`.
 *
 * Handles both link styles:
 *  - `?code=…` — the default email template (PKCE). Must be opened in the
 *    same browser that requested the email, which holds the code verifier.
 *  - `?token_hash=…&type=recovery` — the "Reset Password" email template
 *    linking to `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`,
 *    which also works when the email is opened on another device (phone).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = safeNext(params.get("next"));

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  redirect(ok ? next : "/forgot-password?error=expired");
}

/** Only ever continue to a page inside this app. */
function safeNext(value: string | null) {
  return value === "/reset-password" || value?.startsWith("/dashboard/") ? value : "/reset-password";
}
