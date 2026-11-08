"use server";

import { redirect } from "next/navigation";
import { isTestAccount, requireUser } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/espace/return-to";
import { hasCompanyIdentity } from "@/lib/espace/setup";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { toE164Phone } from "@/lib/company/legal";
import { assignFictionNumber } from "@/lib/simulation/test-accounts";
import { createAdminClient } from "@/lib/supabase/admin";
import { connectPhoneNumber, provisionPhoneNumber, type ProvisionResult } from "@/lib/telephony";
import { getPublicSiteUrl, isReachableFromInternet } from "@/lib/telephony/config";
import { refreshGreetingAudioLater } from "@/lib/telephony/refresh-greeting";

const PAGE = "/espace/reponse-automatique";

const PROVISION_ERRORS: Record<Exclude<ProvisionResult["status"], "ok">, string> = {
  no_regulatory_bundle:
    "Les numéros Batrelio ne sont pas encore disponibles : le dossier réglementaire est en cours de validation. Réessayez dans quelques jours.",
  no_number_available: "Aucun numéro n'est disponible pour le moment. Réessayez un peu plus tard.",
  purchase_limit_reached:
    "Beaucoup d'activations aujourd'hui : votre numéro sera disponible demain. Pour aller plus vite, écrivez-nous à contact@batrelio.com.",
};

const DEFAULT_NUMBER_PURCHASES_PER_DAY = 3;
const DAY_SECONDS = 24 * 60 * 60;

// Each number is billed every month: a burst of sign-ups must not buy dozens of them.
// The cap is shared by everybody; numbers already owned and free are reused without counting.
async function mayPurchaseNumber(): Promise<boolean> {
  const limit = Number(process.env.MAX_NUMBER_PURCHASES_PER_DAY) || DEFAULT_NUMBER_PURCHASES_PER_DAY;
  const allowed = await consumeRateLimit("numberPurchase", "all-accounts", { limit, windowSeconds: DAY_SECONDS });
  if (!allowed) console.error(`Achat de numéro refusé : plafond de ${limit} achats par jour atteint.`);
  return allowed;
}

async function assignedNumbers(): Promise<Set<string>> {
  const { data, error } = await createAdminClient().from("companies").select("phone_number").not("phone_number", "is", null);
  if (error) throw error;
  return new Set(data.flatMap((company) => (company.phone_number ? [company.phone_number] : [])));
}

// Gives the company a provider number (reused or bought) pointed to our webhook.
async function assignProviderNumber(company: {
  id: string;
  phone_number: string | null;
  phone_number_sid: string | null;
}): Promise<string | null> {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl || !isReachableFromInternet(siteUrl)) {
    return "La réponse automatique n'est pas encore disponible : l'adresse publique du site (SITE_URL) n'est pas configurée.";
  }

  try {
    if (company.phone_number && company.phone_number_sid) {
      await connectPhoneNumber(company.phone_number_sid, siteUrl);
      return null;
    }

    const result = await provisionPhoneNumber(siteUrl, await assignedNumbers(), mayPurchaseNumber);
    if (result.status !== "ok") return PROVISION_ERRORS[result.status];

    // Only the server writes the number; the condition keeps a double tap from overwriting it.
    await createAdminClient()
      .from("companies")
      .update({ phone_number: result.number.phoneNumber, phone_number_sid: result.number.sid })
      .eq("id", company.id)
      .is("phone_number", null);
    return null;
  } catch (error) {
    console.error("Attribution du numéro impossible :", error);
    return "Le numéro n'a pas pu être attribué. Réessayez dans un instant.";
  }
}

// Test accounts get a fictional number: nothing is bought from the provider.
async function assignTestNumber(company: { id: string; phone_number: string | null }): Promise<string | null> {
  if (company.phone_number) return null;
  return (await assignFictionNumber(company.id)) ? null : "Le numéro fictif n'a pas pu être attribué. Réessayez.";
}

export async function activateAutoReply(returnTo?: string): Promise<{ error: string }> {
  const { supabase, claims } = await requireUser();

  const { data: company } = await supabase.from("companies").select("*").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };
  // A number is only given to an identified business (and the operator requires one).
  if (!company.phone_number && !hasCompanyIdentity(company)) {
    return { error: "Renseignez d'abord votre entreprise (SIRET, adresse et TVA) : un numéro n'est attribué qu'à une entreprise identifiée." };
  }

  const assignError = isTestAccount(claims.app_metadata)
    ? await assignTestNumber(company)
    : await assignProviderNumber(company);
  if (assignError) return { error: assignError };

  const { error } = await supabase.from("companies").update({ auto_reply_enabled: true }).eq("id", company.id);
  if (error) return { error: "La réponse automatique n'a pas pu être activée. Réessayez." };

  // Recorded before the first missed call comes in.
  refreshGreetingAudioLater(company.id);
  redirect(safeReturnTo(returnTo, PAGE));
}

export async function setAutoReplyEnabled(enabled: boolean): Promise<{ error: string }> {
  const { supabase, claims } = await requireUser();

  // RLS and column privileges: the artisan can only switch their own auto reply.
  const { error } = await supabase.from("companies").update({ auto_reply_enabled: enabled }).eq("owner_id", claims.sub);
  if (error) return { error: "Le réglage n'a pas pu être enregistré. Réessayez." };

  redirect(PAGE);
}

const MAX_EXCLUSION_LABEL_LENGTH = 60;
const UNIQUE_VIOLATION = "23505";

async function insertExclusion(phone: string, label: string | null): Promise<{ error: string }> {
  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("id").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  // RLS only lets the artisan add numbers to their own list.
  const { error } = await supabase.from("auto_reply_exclusions").insert({ company_id: company.id, phone, label });
  if (error?.code === UNIQUE_VIOLATION) return { error: "Ce numéro est déjà exclu." };
  if (error) return { error: "Le numéro n'a pas pu être ajouté. Réessayez." };

  redirect(PAGE);
}

export async function addExclusion(formData: FormData): Promise<{ error: string }> {
  const phone = toE164Phone(String(formData.get("phone") ?? ""));
  const label = String(formData.get("label") ?? "").trim();
  if (!phone) return { error: "Ce numéro de téléphone n'est pas valide." };
  if (label.length > MAX_EXCLUSION_LABEL_LENGTH) return { error: "Le nom est trop long." };

  return insertExclusion(phone, label || null);
}

// One tap from the call history: the artisan does not retype the number.
export async function excludeCaller(phone: string): Promise<{ error: string }> {
  const e164 = toE164Phone(phone);
  if (!e164) return { error: "Ce numéro ne peut pas être exclu." };
  return insertExclusion(e164, null);
}

export async function removeExclusion(exclusionId: string): Promise<{ error: string }> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("auto_reply_exclusions").delete().eq("id", exclusionId);
  if (error) return { error: "Le numéro n'a pas pu être retiré. Réessayez." };

  redirect(PAGE);
}

// Setup guide: the artisan dialled the forwarding code. The first forwarded call confirms it.
export async function confirmCallForwarding(): Promise<{ error: string }> {
  const { supabase, claims } = await requireUser();
  const { error } = await supabase
    .from("companies")
    .update({ call_forwarding_confirmed_at: new Date().toISOString() })
    .eq("owner_id", claims.sub);
  if (error) return { error: "Le réglage n'a pas pu être enregistré. Réessayez." };

  redirect("/espace/demarrage");
}
