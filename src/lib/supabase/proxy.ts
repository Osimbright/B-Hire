import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];
const ROLE_AREA = /^\/dashboard\/(client|freelancer)(?:\/|$)/;

/**
 * Runs before every page request (see src/proxy.ts):
 *  1. Refreshes the Supabase session cookie when the access token expires.
 *  2. Sends logged-out visitors on /dashboard/* to /login.
 *  3. Sends logged-in users to the dashboard for their role — from /login,
 *     /signup, /dashboard, or the other role's area.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Update the request so Server Components see the fresh session…
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          // …and the response so the browser stores it.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Keep getClaims() directly after createServerClient: it verifies the JWT
  // and triggers the token refresh handled in setAll above.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const { pathname } = request.nextUrl;

  if (!userId) {
    if (pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return redirectKeepingCookies(loginUrl, response);
    }
    return response;
  }

  const area = pathname.match(ROLE_AREA)?.[1];
  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (!area && !isAuthPage && pathname !== "/dashboard") return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role: string | undefined = profile?.role;

  if (!role) {
    // Signed in but no profile (e.g. the account predates the schema).
    return isAuthPage
      ? response
      : redirectKeepingCookies(new URL("/login?error=no-profile", request.url), response);
  }

  if (area !== role) {
    return redirectKeepingCookies(new URL(`/dashboard/${role}`, request.url), response);
  }
  return response;
}

/** Redirect without dropping any refreshed auth cookies from `from`. */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const name of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(name);
    if (value) redirect.headers.set(name, value);
  }
  return redirect;
}
