import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/brand/app-icon";

// Shown by iPhone when the artisan adds Batrelio to their home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconArt size={180} />, size);
}
