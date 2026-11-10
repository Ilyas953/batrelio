import "server-only";
import { detectPhotoType, EXTENSION_BY_TYPE } from "@/lib/requests/photo-files";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOGO_BUCKET, MAX_LOGO_BYTES } from "./logo-file";

const DOCUMENT_URL_LIFETIME_SECONDS = 60 * 60;

export type CheckedLogo = { bytes: Uint8Array; contentType: keyof typeof EXTENSION_BY_TYPE; extension: string };

export async function readLogoFile(formData: FormData): Promise<CheckedLogo | { error: string }> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez une image." };
  if (file.size > MAX_LOGO_BYTES) return { error: "Ce logo est trop lourd (2 Mo maximum)." };

  // The declared type comes from the browser: trust the file's first bytes instead.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectPhotoType(bytes);
  if (!contentType) return { error: "Le logo doit être une image PNG, JPEG ou WebP." };
  return { bytes, contentType, extension: EXTENSION_BY_TYPE[contentType] };
}

// Short-lived link to show the logo (on documents, or in Mon entreprise). Null without a logo.
export async function logoUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await createAdminClient().storage.from(LOGO_BUCKET).createSignedUrl(path, DOCUMENT_URL_LIFETIME_SECONDS);
  return data?.signedUrl ?? null;
}

// Every logo of a company, e.g. when its account is deleted.
export async function removeCompanyLogos(companyId: string): Promise<void> {
  const storage = createAdminClient().storage.from(LOGO_BUCKET);
  const { data: files } = await storage.list(companyId, { limit: 100 });
  if (files?.length) await storage.remove(files.map((file) => `${companyId}/${file.name}`));
}
