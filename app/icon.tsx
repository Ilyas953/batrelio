import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/brand/app-icon";

// Icons for the home screen (web app manifest) and the browser tab.
export const contentType = "image/png";

const SIZES = [192, 512];

export function generateImageMetadata() {
  return SIZES.map((size) => ({ id: String(size), size: { width: size, height: size }, contentType }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  return new ImageResponse(<AppIconArt size={size} />, { width: size, height: size });
}
