import "server-only";
import { hasAdminRole, requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export type Account = {
  userId: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  company: Pick<
    Tables<"companies">,
    "id" | "name" | "sms_sender_name" | "siret" | "trade" | "region"
  > | null;
};

const MAX_USERS_PER_PAGE = 1000;

export async function listAccounts(): Promise<Account[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  const [usersResult, companiesResult] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: MAX_USERS_PER_PAGE }),
    supabase.from("companies").select("id, owner_id, name, sms_sender_name, siret, trade, region"),
  ]);
  if (usersResult.error) throw usersResult.error;
  if (companiesResult.error) throw companiesResult.error;

  const companiesByOwner = new Map(
    companiesResult.data.map((company) => [company.owner_id, company]),
  );

  return usersResult.data.users
    .map((user) => ({
      userId: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      isAdmin: hasAdminRole(user.app_metadata),
      company: companiesByOwner.get(user.id) ?? null,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
