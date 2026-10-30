import "server-only";
import { requireUser } from "@/lib/auth/session";
import { PHOTO_BUCKET } from "@/lib/requests/limits";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHOTO_URL_LIFETIME_SECONDS = 60 * 60;

// RLS restricts both the request and its photo files to the artisan's own company.
export async function getRequestDetail(requestId: string) {
  if (!UUID_PATTERN.test(requestId)) return null;
  const { supabase } = await requireUser();

  const { data: request, error } = await supabase
    .from("requests")
    .select("id, source, status, customer_name, customer_phone, description, address, created_at, photos:request_photos(storage_path, created_at)")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw error;
  if (!request) return null;

  const paths = request.photos
    .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
    .map((photo) => photo.storage_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_LIFETIME_SECONDS)
    : { data: [] };

  return {
    ...request,
    photoUrls: (signed ?? []).flatMap((photo) => (photo.signedUrl ? [photo.signedUrl] : [])),
  };
}
