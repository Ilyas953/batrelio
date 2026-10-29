import "server-only";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
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

async function getSignedInClaims() {
  // Session checks compare the token expiry with the current time: they must run
  // at request time, never during a prerender (even one that can read cookies).
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/connexion");
  }

  return { supabase, claims: data.claims };
}

export async function requireUser() {
  return getSignedInClaims();
}

export async function requireAdmin() {
  const { claims } = await getSignedInClaims();
  if (!hasAdminRole(claims.app_metadata)) {
    notFound();
  }

  return claims;
}
