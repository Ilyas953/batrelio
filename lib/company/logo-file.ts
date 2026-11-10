import { randomUUID } from "node:crypto";

// The company logo: a small image (PNG, JPEG or WebP; never SVG, which can carry scripts).
export const LOGO_BUCKET = "company-logos";
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const LOGO_PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/;

// A new file for every logo: documents already sent keep pointing to theirs.
export function newLogoPath(companyId: string, extension: string): string {
  return `${companyId}/${randomUUID()}.${extension}`;
}

// The stored path belongs to this company's folder (and nobody else's).
export function isOwnLogoPath(companyId: string, path: string | null | undefined): path is string {
  return typeof path === "string" && LOGO_PATH_PATTERN.test(path) && path.startsWith(`${companyId}/`);
}
