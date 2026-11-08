"use server";

import { isTestAccount, requireUser } from "@/lib/auth/session";
import { toE164Phone } from "@/lib/company/legal";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { placeTestCall } from "@/lib/telephony";

// Each call is billed: a handful of tries is plenty.
const TEST_CALLS_PER_DAY = 6;
const DAY_SECONDS = 24 * 60 * 60;

export type TestCallResult = { calling: true } | { error: string };

// Batrelio rings the phone customers call. Not answering it makes the operator forward the call
// back to Batrelio: the missed call that arrives proves everything works.
export async function startTestCall(phoneInput: string): Promise<TestCallResult> {
  const { supabase, claims } = await requireUser();
  if (isTestAccount(claims.app_metadata)) return { error: "En compte de test, utilisez le simulateur : le numéro est fictif." };

  const { data: company } = await supabase.from("companies").select("id, phone_number, phone_number_sid, auto_reply_enabled").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };
  if (!company.phone_number || !company.phone_number_sid || !company.auto_reply_enabled) {
    return { error: "Activez d'abord votre numéro Batrelio (étape 2)." };
  }

  const to = toE164Phone(phoneInput);
  if (!to?.startsWith("+33")) return { error: "Indiquez le numéro français que vos clients appellent." };
  if (to === company.phone_number) return { error: "Indiquez votre numéro habituel, pas votre numéro Batrelio." };

  const allowed = await consumeRateLimit("testCall", company.id, { limit: TEST_CALLS_PER_DAY, windowSeconds: DAY_SECONDS });
  if (!allowed) return { error: `Vous avez déjà lancé ${TEST_CALLS_PER_DAY} essais aujourd'hui. Réessayez demain, ou faites-vous appeler par un proche.` };

  const call = await placeTestCall(to, company.phone_number);
  if (call.status === "failed") {
    console.error(`Appel d'essai impossible : ${call.reason}`);
    return { error: "L'appel d'essai n'a pas pu partir. Réessayez dans un instant." };
  }
  return { calling: true };
}
