"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireTestAccount } from "@/lib/auth/session";
import { toE164Phone } from "@/lib/company/legal";
import { simulateMissedCall, type SimulatedCall } from "@/lib/simulation/simulated-call";
import { createTestAccount, deleteTestAccount, signInAsTestAccount } from "@/lib/simulation/test-accounts";
import { getPublicSiteUrl } from "@/lib/telephony/config";

export type SimulateCallState = { error?: string; call?: SimulatedCall; callerInput?: string; hidden?: boolean };

// Links in the shown SMS must open on the site being tested, even locally.
async function currentSiteUrl(): Promise<string> {
  return getPublicSiteUrl() ?? (await headers()).get("origin") ?? "";
}

export async function simulateCall(_previous: SimulateCallState, formData: FormData): Promise<SimulateCallState> {
  const { supabase } = await requireTestAccount();
  const callerInput = String(formData.get("caller") ?? "").trim();
  const hidden = formData.get("hidden") === "on";
  const keep = { callerInput, hidden };

  const { data: company } = await supabase.from("companies").select("id, phone_number").maybeSingle();
  if (!company) return { ...keep, error: "Aucune entreprise n'est liée à ce compte." };
  if (!company.phone_number) {
    return { ...keep, error: "Activez d'abord votre numéro Batrelio (étape 3 du guide) : sans lui, l'appel n'arrive nulle part." };
  }

  const callerPhone = hidden ? undefined : toE164Phone(callerInput);
  if (callerPhone === null) return { ...keep, error: "Ce numéro de téléphone n'est pas valide." };

  try {
    return { ...keep, call: await simulateMissedCall(company.id, callerPhone, await currentSiteUrl()) };
  } catch (error) {
    console.error("Appel simulé impossible :", error);
    return { ...keep, error: "L'appel n'a pas pu être simulé. Réessayez." };
  }
}

// A brand new blank test account replaces this one, to redo the setup from the start.
export async function restartTestAccount(): Promise<{ error: string }> {
  const { supabase, claims } = await requireTestAccount();
  const { data: company } = await supabase.from("companies").select("trade").maybeSingle();

  try {
    await signInAsTestAccount(await createTestAccount(company?.trade ?? null));
    await deleteTestAccount(claims.sub);
  } catch (error) {
    console.error("Nouveau compte de test impossible :", error);
    return { error: "Le compte n'a pas pu être remis à zéro. Réessayez." };
  }

  redirect("/espace/demarrage");
}
