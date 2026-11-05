"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { MAX_ADMIN_NOTE_LENGTH, isMissionStatus, readNote } from "@/lib/missions/shared-mission";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateMission(missionId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const status = formData.get("status");
  const read = readNote(formData.get("adminNote"), MAX_ADMIN_NOTE_LENGTH);
  if (!UUID_PATTERN.test(missionId) || !isMissionStatus(status) || "error" in read) {
    redirect(`/admin/missions?erreur=1#mission-${missionId}`);
  }

  const { error } = await createAdminClient()
    .from("shared_missions")
    .update({ status, admin_note: read.note })
    .eq("id", missionId);
  if (error) throw error;
  redirect(`/admin/missions#mission-${missionId}`);
}
