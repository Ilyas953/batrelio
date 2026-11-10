"use server";

import { requireUser } from "@/lib/auth/session";
import { readLogoFile } from "@/lib/company/logo";
import { LOGO_BUCKET, newLogoPath } from "@/lib/company/logo-file";
import { createAdminClient } from "@/lib/supabase/admin";

export type LogoState = { error?: string; saved?: boolean };

// Checks the image, stores it under the company's folder, then points the company to it.
// Written by the server only: the artisan never chooses the stored path.
export async function uploadLogo(_previous: LogoState, formData: FormData): Promise<LogoState> {
  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("id").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const logo = await readLogoFile(formData);
  if ("error" in logo) return logo;

  const admin = createAdminClient();
  const path = newLogoPath(company.id, logo.extension);
  const { error: uploadError } = await admin.storage.from(LOGO_BUCKET).upload(path, logo.bytes, { contentType: logo.contentType });
  if (uploadError) return { error: "Le logo n'a pas pu être enregistré. Réessayez." };

  const { error } = await admin.from("companies").update({ logo_path: path }).eq("id", company.id);
  if (error) return { error: "Le logo n'a pas pu être enregistré. Réessayez." };
  return { saved: true };
}

// The documents already sent keep their logo; new ones go without.
export async function removeLogo(): Promise<LogoState> {
  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("id").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };
  const { error } = await createAdminClient().from("companies").update({ logo_path: null }).eq("id", company.id);
  return error ? { error: "Le logo n'a pas pu être retiré. Réessayez." } : { saved: true };
}
