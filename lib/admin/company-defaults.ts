// Default derived from the company name, so the admin only has to type the name.
// Follows the constraint of the companies table.

export const SMS_SENDER_PATTERN = /^[A-Za-z0-9 ]{1,11}$/;

function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
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
