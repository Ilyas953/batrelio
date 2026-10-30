"use server";

import { requireUser } from "@/lib/auth/session";
import { toE164Phone } from "@/lib/company/legal";
import { MAX_CUSTOMER_NAME_LENGTH } from "@/lib/requests/limits";
import { getSiteOrigin } from "@/lib/requests/site-origin";

export type CreatedLink = { url: string; shareText: string; customerPhone: string | null };
export type CreateLinkResult = { error: string } | { link: CreatedLink };

export async function createRequestLink(formData: FormData): Promise<CreateLinkResult> {
  const { supabase } = await requireUser();

  const customerName = String(formData.get("customerName") ?? "").trim();
  const phoneInput = String(formData.get("customerPhone") ?? "").trim();
  const customerPhone = phoneInput ? toE164Phone(phoneInput) : null;
  if (phoneInput && !customerPhone) return { error: "Ce numéro de téléphone n'est pas valide." };
  if (customerName.length > MAX_CUSTOMER_NAME_LENGTH) return { error: "Le nom est trop long." };

  // RLS only returns, and only lets the artisan link to, their own company.
  const { data: company, error: companyError } = await supabase.from("companies").select("id, name").maybeSingle();
  if (companyError || !company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const { data: link, error } = await supabase
    .from("request_links")
    .insert({ company_id: company.id, customer_name: customerName || null, customer_phone: customerPhone })
    .select("token")
    .single();
  if (error) return { error: "Le lien n'a pas pu être créé. Réessayez." };

  const url = `${await getSiteOrigin()}/demande/${link.token}`;
  return {
    link: {
      url,
      customerPhone,
      shareText: `Bonjour, c'est ${company.name}. Pour préparer votre devis, décrivez votre besoin et ajoutez des photos ici : ${url}`,
    },
  };
}
