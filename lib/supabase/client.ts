import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { AUTH_COOKIE_OPTIONS } from "./cookie-options";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

// Supabase client for Client Components.
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
  });
}
