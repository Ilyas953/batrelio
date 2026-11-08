import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { AUTH_COOKIE_OPTIONS, withAuthCookieLifetime } from "./cookie-options";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import { loginUrlFor } from "@/lib/auth/next-path";

// Refreshes the auth session before the page renders and writes the new cookies.
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, withAuthCookieLifetime(options)),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  // Signed out on a private page (e.g. the link of a new-request SMS): sign in, then come back here.
  const { pathname, search } = request.nextUrl;
  if (!data?.claims && /^\/(espace|admin)(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL(loginUrlFor(pathname + search), request.url));
  }

  return response;
}
