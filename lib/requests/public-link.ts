import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

export type CustomerLink =
  | { status: "open"; companyName: string; customerName: string | null; customerPhone: string | null }
  | { status: "used" | "expired" | "not_found" };

export function isWellFormedToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

// Customers have no account: the link token is their only credential, checked here
// with the secret key. Only the company name leaves the server.
export async function getCustomerLink(token: string): Promise<CustomerLink> {
  if (!isWellFormedToken(token)) return { status: "not_found" };

  const { data, error } = await createAdminClient()
    .from("request_links")
    .select("customer_name, customer_phone, expires_at, used_at, company:companies(name)")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;

  if (!data) return { status: "not_found" };
  if (data.used_at) return { status: "used" };
  if (new Date(data.expires_at) <= new Date()) return { status: "expired" };

  return {
    status: "open",
    companyName: data.company.name,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
  };
}
