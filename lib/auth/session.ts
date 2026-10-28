import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The role lives in app_metadata, which only the secret key can write:
// a user can never grant it to themselves.
export function hasAdminRole(appMetadata: unknown): boolean {
  return (
    typeof appMetadata === "object" &&
    appMetadata !== null &&
    (appMetadata as { role?: unknown }).role === "admin"
  );
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/connexion");
  }
  if (!hasAdminRole(data.claims.app_metadata)) {
    notFound();
  }

  return data.claims;
}
