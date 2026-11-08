// Where to go after signing in: the page the artisan was trying to open (e.g. a request,
// from the new-request SMS). Only pages of the app, so a crafted link cannot send them elsewhere.
const MAX_LENGTH = 300;

export const NEXT_PATH_PARAM = "suite";

export function safeNextPath(value: unknown, isAdmin: boolean): string {
  const fallback = isAdmin ? "/admin" : "/espace";
  if (typeof value !== "string" || value.length > MAX_LENGTH) return fallback;
  if (!/^\/(espace|admin)(\/[A-Za-z0-9\-/]*)?(\?[A-Za-z0-9=&\-_%]*)?(#[A-Za-z0-9\-_]*)?$/.test(value)) return fallback;
  if (value.includes("//")) return fallback;
  // The admin area is only for admins.
  if (value.startsWith("/admin") && !isAdmin) return fallback;
  return value;
}

export function loginUrlFor(path: string): string {
  return `/connexion?${NEXT_PATH_PARAM}=${encodeURIComponent(path)}`;
}
