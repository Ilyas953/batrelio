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
    .select("id, company_id, status, customer_name, customer_phone, company:companies(name)")
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
