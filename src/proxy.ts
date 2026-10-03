import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Runs before dashboard and auth pages (Next.js 16 renamed `middleware` to
 * `proxy`). The work happens in src/lib/supabase/proxy.ts: refresh the
 * Supabase session cookie, send logged-out visitors on /dashboard/* to
 * /login, and send logged-in users to the dashboard for their role.
 *
 * The matcher covers every page that depends on being signed in. Server
 * Components can't write cookies, so a refreshed token would be lost on any
 * page outside it — which is why /login and /signup are included too.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
