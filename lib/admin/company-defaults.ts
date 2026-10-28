// Defaults derived from the company name, so the admin only has to type the name.
// Both follow the constraints of the companies table.

export const SMS_SENDER_PATTERN = /^[A-Za-z0-9 ]{1,11}$/;
export const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function toSlug(companyName: string): string {
  return removeAccents(companyName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/, "");
}

export function toSmsSenderName(companyName: string): string {
  return removeAccents(companyName)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 11);
}

export function isValidSmsSenderName(senderName: string): boolean {
  return SMS_SENDER_PATTERN.test(senderName) && /[A-Za-z]/.test(senderName);
}
