import "server-only";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_PHOTOS } from "./limits";

type PhotoType = (typeof ACCEPTED_PHOTO_TYPES)[number];

const EXTENSION_BY_TYPE: Record<PhotoType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// The declared type comes from the browser: trust the file's first bytes instead.
function detectPhotoType(bytes: Uint8Array): PhotoType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export type CheckedPhoto = { bytes: Uint8Array; contentType: PhotoType; extension: string };

export async function readPhotos(formData: FormData): Promise<CheckedPhoto[] | { error: string }> {
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_PHOTOS) return { error: `Vous pouvez ajouter ${MAX_PHOTOS} photos au maximum.` };

  const photos: CheckedPhoto[] = [];
  for (const file of files) {
    if (file.size > MAX_PHOTO_BYTES) return { error: "Une des photos est trop lourde (2 Mo maximum)." };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = detectPhotoType(bytes);
    if (!contentType) return { error: "Seules les photos JPEG, PNG ou WebP sont acceptées." };

    photos.push({ bytes, contentType, extension: EXTENSION_BY_TYPE[contentType] });
  }
  return photos;
}
