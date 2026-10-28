import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "./env";

// Bypasses Row Level Security: only call it after requireAdmin().
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Variable d'environnement manquante : SUPABASE_SECRET_KEY (voir .env.example)");
  }

  return createClient<Database>(SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
