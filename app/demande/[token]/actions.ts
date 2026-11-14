"use server";

import { after } from "next/server";
import { toE164Phone } from "@/lib/company/legal";
import { TOO_MANY_ATTEMPTS, isAllowedFromThisVisitor } from "@/lib/security/rate-limit";
import {
  MAX_ADDRESS_LENGTH,
  MAX_CUSTOMER_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  PHOTO_BUCKET,
} from "@/lib/requests/limits";
import { readPhotos, type CheckedPhoto } from "@/lib/requests/photo-files";
import { notifyArtisanOfNewRequest } from "@/lib/requests/notify-artisan";
import { isWellFormedToken } from "@/lib/requests/public-link";
import { getSiteOrigin } from "@/lib/requests/site-origin";
import { getPublicSiteUrl } from "@/lib/telephony/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubmitRequestResult = { error: string } | { ok: true; savedPhotos: number; failedPhotos: number };

type CustomerRequest = { name: string; phone: string; description: string; address: string };

function readText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function readCustomerRequest(formData: FormData): CustomerRequest | { error: string } {
  const phone = toE164Phone(readText(formData, "phone"));
  const request = {
    name: readText(formData, "name"),
    phone: phone ?? "",
    description: readText(formData, "description"),
    address: readText(formData, "address"),
  };

  if (!phone) return { error: "Indiquez un numéro de téléphone valide, pour que l'artisan puisse vous rappeler." };
  if (!request.description) return { error: "Décrivez votre besoin en quelques mots." };
  if (request.description.length > MAX_DESCRIPTION_LENGTH) return { error: "Votre message est trop long." };
  if (request.address.length > MAX_ADDRESS_LENGTH) return { error: "L'adresse est trop longue." };
  if (request.name.length > MAX_CUSTOMER_NAME_LENGTH) return { error: "Le nom est trop long." };
  return request;
}

type Admin = ReturnType<typeof createAdminClient>;

// Storing is best effort per photo: the request is already saved, a failed photo must not lose it.
// All photos upload at once (the customer is waiting), and keep the order they were picked in.
async function storePhotos(supabase: Admin, companyId: string, requestId: string, photos: CheckedPhoto[]) {
  const uploads = await Promise.all(
    photos.map(async (photo) => {
      const path = `${companyId}/${requestId}/${crypto.randomUUID()}.${photo.extension}`;
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, photo.bytes, { contentType: photo.contentType });
      return error ? null : path;
    }),
  );
  const storedPaths = uploads.filter((path) => path !== null);

  if (storedPaths.length > 0) {
    await supabase.from("request_photos").insert(
      storedPaths.map((storage_path) => ({ company_id: companyId, request_id: requestId, storage_path })),
    );
  }
  return storedPaths.length;
}

// Public: the customer has no account. The single-use token is the only credential.
export async function submitCustomerRequest(token: string, formData: FormData): Promise<SubmitRequestResult> {
  if (!isWellFormedToken(token)) return { error: "Ce lien n'est pas valide." };
  if (!(await isAllowedFromThisVisitor("customerRequestPerIp"))) return { error: TOO_MANY_ATTEMPTS };

  const request = readCustomerRequest(formData);
  if ("error" in request) return request;
  const photos = await readPhotos(formData);
  if ("error" in photos) return photos;

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Claims the link in one statement, so a double tap cannot create two requests.
  const { data: link, error: claimError } = await supabase
    .from("request_links")
    .update({ used_at: now })
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("id, company_id, request_id")
    .maybeSingle();
  if (claimError) return { error: "La demande n'a pas pu être envoyée. Réessayez." };
  if (!link) return { error: "Ce lien a déjà été utilisé ou a expiré. Demandez-en un nouveau à l'artisan." };

  const details = {
    customer_name: request.name || null,
    customer_phone: request.phone,
    description: request.description,
    address: request.address || null,
    // From now on the request shows in the artisan space.
    submitted_at: now,
  };
  // A link sent after a missed call completes the request created when the customer called.
  const { data: saved, error: saveError } = link.request_id
    ? await supabase
        .from("requests")
        .update(details)
        .eq("id", link.request_id)
        .eq("company_id", link.company_id)
        .select("id")
        .single()
    : await supabase
        .from("requests")
        .insert({ company_id: link.company_id, source: "link", ...details })
        .select("id")
        .single();
  if (saveError) {
    await supabase.from("request_links").update({ used_at: null }).eq("id", link.id);
    return { error: "La demande n'a pas pu être envoyée. Réessayez." };
  }

  await supabase.from("request_links").update({ request_id: saved.id }).eq("id", link.id);
  const savedPhotos = await storePhotos(supabase, link.company_id, saved.id, photos);

  // After the answer: the customer does not wait for the artisan's SMS.
  const siteUrl = getPublicSiteUrl() ?? (await getSiteOrigin());
  after(() => notifyArtisanOfNewRequest(saved.id, siteUrl));

  return { ok: true, savedPhotos, failedPhotos: photos.length - savedPhotos };
}
