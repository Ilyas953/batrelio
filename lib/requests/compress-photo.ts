import { MAX_PHOTO_BYTES } from "./limits";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

// Phone photos weigh 3 to 8 MB: resizing them in the browser makes the upload fast on 4G,
// and re-encoding drops the metadata (including the GPS position) the photo may carry.
export async function compressPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (blob) {
      const name = file.name.replace(/\.[^.]+$/, "") || "photo";
      return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
    }
  } catch {
    // Format the browser cannot decode: send the original if it is small enough.
  }

  if (file.size <= MAX_PHOTO_BYTES) return file;
  throw new Error(`La photo « ${file.name} » n'a pas pu être préparée. Essayez avec une autre photo.`);
}
