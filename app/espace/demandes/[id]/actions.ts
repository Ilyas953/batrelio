"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { MAX_ARTISAN_NOTE_LENGTH, readNote } from "@/lib/missions/shared-mission";
import { readVisitInput, visitMessage } from "@/lib/requests/visit";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNIQUE_VIOLATION = "23505";

// RLS: only finds a request of the artisan's own company.
async function findOwnRequest(requestId: string) {
  if (!UUID_PATTERN.test(requestId)) return null;
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("requests")
    .select("id, company_id, status, source, submitted_at, customer_name, customer_phone, company:companies(name)")
    .eq("id", requestId)
    .maybeSingle();
  return data;
}

export type VisitProposal = { shareText: string; customerPhone: string };

export async function proposeVisit(requestId: string, formData: FormData): Promise<{ error: string } | { proposal: VisitProposal }> {
  const request = await findOwnRequest(requestId);
  if (!request) return { error: "Demande introuvable." };
  if (request.status === "shared") return { error: "Cette mission a été partagée : elle ne peut plus être modifiée." };

  const input = readVisitInput(formData.get("date"), formData.get("time"), new Date());
  if ("error" in input) return input;

  // A quote already sent stays the request's progress; the visit date is kept alongside.
  const status = request.status === "quoted" || request.status === "closed" ? request.status : "visit_proposed";
  const { error } = await createAdminClient()
    .from("requests")
    .update({ visit_at: input.visitAt.toISOString(), status })
    .eq("id", request.id)
    .eq("company_id", request.company_id);
  if (error) return { error: "La visite n'a pas pu être enregistrée. Réessayez." };

  return {
    proposal: {
      shareText: visitMessage({ companyName: request.company?.name ?? "", customerName: request.customer_name, visitAt: input.visitAt }),
      customerPhone: request.customer_phone,
    },
  };
}

export async function shareMission(requestId: string, formData: FormData): Promise<{ error: string }> {
  const request = await findOwnRequest(requestId);
  if (!request) return { error: "Demande introuvable." };

  const read = readNote(formData.get("note"), MAX_ARTISAN_NOTE_LENGTH);
  if ("error" in read) return read;

  const admin = createAdminClient();
  const { error } = await admin
    .from("shared_missions")
    .insert({ request_id: request.id, company_id: request.company_id, artisan_note: read.note });
  if (error?.code === UNIQUE_VIOLATION) return { error: "Cette mission a déjà été partagée." };
  if (error) return { error: "La mission n'a pas pu être partagée. Réessayez." };

  await admin.from("requests").update({ status: "shared" }).eq("id", request.id).eq("company_id", request.company_id);
  redirect(`/espace/demandes/${request.id}`);
}

// Settled by phone, not for the artisan, a wrong number…: the request leaves the list to handle.
export async function closeRequest(requestId: string): Promise<{ error?: string }> {
  const request = await findOwnRequest(requestId);
  if (!request) return { error: "Demande introuvable." };
  if (request.status !== "new") return { error: "Seule une demande à traiter peut être classée." };

  const { error } = await createAdminClient()
    .from("requests")
    .update({ status: "closed" })
    .eq("id", request.id)
    .eq("company_id", request.company_id)
    .eq("status", "new");
  return error ? { error: "La demande n'a pas pu être classée. Réessayez." } : {};
}

export async function reopenRequest(requestId: string): Promise<{ error?: string }> {
  const request = await findOwnRequest(requestId);
  if (!request) return { error: "Demande introuvable." };
  if (request.status !== "closed") return { error: "Cette demande n'est pas classée." };

  const { error } = await createAdminClient()
    .from("requests")
    .update({ status: "new" })
    .eq("id", request.id)
    .eq("company_id", request.company_id)
    .eq("status", "closed");
  return error ? { error: "La demande n'a pas pu être remise à traiter. Réessayez." } : {};
}

// "C'est fait" on a missed call: every call of this number still waiting is settled at once.
// If the customer describes their need later through the SMS link, the request comes back.
export async function markMissedCallsDone(requestId: string): Promise<{ error?: string }> {
  const request = await findOwnRequest(requestId);
  if (!request || request.source !== "missed_call" || request.submitted_at) return { error: "Appel introuvable." };

  const { error } = await createAdminClient()
    .from("requests")
    .update({ status: "closed" })
    .eq("company_id", request.company_id)
    .eq("customer_phone", request.customer_phone)
    .eq("source", "missed_call")
    .eq("status", "new")
    .is("submitted_at", null);
  return error ? { error: "L'appel n'a pas pu être marqué comme rappelé. Réessayez." } : {};
}
