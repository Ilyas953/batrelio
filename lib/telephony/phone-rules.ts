// Pseudo numbers the provider uses for hidden or unavailable caller ids.
const HIDDEN_CALLER_IDS = new Set(["+266696687", "+7378742833", "+2562533", "+8656696", "+86282452253"]);

export function isIdentifiedCaller(phone: string | null | undefined): phone is string {
  return !!phone && /^\+[1-9][0-9]{6,14}$/.test(phone) && !HIDDEN_CALLER_IDS.has(phone);
}

// SMS only reach mobile phones: French mobile numbers start with 06 or 07.
export function isFrenchMobile(phone: string): boolean {
  return /^\+33[67][0-9]{8}$/.test(phone);
}
