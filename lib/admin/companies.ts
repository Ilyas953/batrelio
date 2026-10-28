import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCompany(companyId: string): Promise<Tables<"companies"> | null> {
  await requireAdmin();
  if (!UUID_PATTERN.test(companyId)) return null;

  const { data, error } = await createAdminClient()
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();
  if (error) throw error;

  return data;
}
