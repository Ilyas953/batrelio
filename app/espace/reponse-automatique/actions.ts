"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { connectPhoneNumber, provisionPhoneNumber, type ProvisionResult } from "@/lib/telephony";
import { getPublicSiteUrl, isReachableFromInternet } from "@/lib/telephony/config";

const PAGE = "/espace/reponse-automatique";

const PROVISION_ERRORS: Record<Exclude<ProvisionResult["status"], "ok">, string> = {
  no_regulatory_bundle:
    "Les numéros Batrelio ne sont pas encore disponibles : le dossier réglementaire est en cours de validation. Réessayez dans quelques jours.",
  no_number_available: "Aucun numéro n'est disponible pour le moment. Réessayez un peu plus tard.",
};

async function assignedNumbers(): Promise<Set<string>> {
  const { data, error } = await createAdminClient().from("companies").select("phone_number").not("phone_number", "is", null);
  if (error) throw error;
  return new Set(data.flatMap((company) => (company.phone_number ? [company.phone_number] : [])));
}

export async function activateAutoReply(): Promise<{ error: string }> {
  const { supabase } = await requireUser();

  const siteUrl = getPublicSiteUrl();
  if (!siteUrl || !isReachableFromInternet(siteUrl)) {
    return { error: "La réponse automatique n'est pas encore disponible : l'adresse publique du site (SITE_URL) n'est pas configurée." };
  }

  const { data: company } = await supabase.from("companies").select("id, phone_number, phone_number_sid").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  try {
    if (company.phone_number && company.phone_number_sid) {
      await connectPhoneNumber(company.phone_number_sid, siteUrl);
    } else {
      const result = await provisionPhoneNumber(siteUrl, await assignedNumbers());
      if (result.status !== "ok") return { error: PROVISION_ERRORS[result.status] };

      // Only the server writes the number; the condition keeps a double tap from overwriting it.
      await createAdminClient()
        .from("companies")
        .update({ phone_number: result.number.phoneNumber, phone_number_sid: result.number.sid })
        .eq("id", company.id)
        .is("phone_number", null);
    }
  } catch (error) {
    console.error("Attribution du numéro impossible :", error);
    return { error: "Le numéro n'a pas pu être attribué. Réessayez dans un instant." };
  }

  const { error } = await supabase.from("companies").update({ auto_reply_enabled: true }).eq("id", company.id);
  if (error) return { error: "La réponse automatique n'a pas pu être activée. Réessayez." };

  redirect(PAGE);
}

export async function setAutoReplyEnabled(enabled: boolean): Promise<{ error: string }> {
  const { supabase, claims } = await requireUser();

  // RLS and column privileges: the artisan can only switch their own auto reply.
  const { error } = await supabase.from("companies").update({ auto_reply_enabled: enabled }).eq("owner_id", claims.sub);
  if (error) return { error: "Le réglage n'a pas pu être enregistré. Réessayez." };

  redirect(PAGE);
}
