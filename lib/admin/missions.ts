import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { PHOTO_BUCKET } from "@/lib/requests/limits";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_MISSIONS = 200;
const PHOTO_URL_LIFETIME_SECONDS = 60 * 60;

// Every mission shared by an artisan, newest first, with what Batrelio needs to place it.
export async function listSharedMissions() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shared_missions")
    .select(
      "id, status, artisan_note, admin_note, created_at, updated_at, request:requests(id, customer_name, customer_phone, description, address, visit_at, created_at, photos:request_photos(storage_path, created_at), company:companies(id, name, trade, region, city, contact_phone))",
    )
    .order("created_at", { ascending: false })
    .limit(MAX_MISSIONS);
  if (error) throw error;

  const paths = data.flatMap((mission) =>
    (mission.request?.photos ?? [])
      .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
      .map((photo) => photo.storage_path),
  );
  // One call signs every photo on the page.
  const { data: signed } = paths.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_LIFETIME_SECONDS)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).flatMap((photo) => (photo.path && photo.signedUrl ? [[photo.path, photo.signedUrl]] : [])));

  return data.map((mission) => ({
    ...mission,
    photoUrls: (mission.request?.photos ?? []).flatMap((photo) => urlByPath.get(photo.storage_path) ?? []),
  }));
}

export type SharedMission = Awaited<ReturnType<typeof listSharedMissions>>[number];
