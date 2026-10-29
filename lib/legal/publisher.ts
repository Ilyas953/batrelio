// Identity of the company that publishes and sells Batrelio, printed on every legal page.
// Values in brackets must be filled in before going live: a legal page with a missing
// mention is not compliant (loi n° 2004-575 du 21 juin 2004, LCEN).

const TO_COMPLETE = (what: string) => `[À compléter : ${what}]`;

export const PUBLISHER = {
  brand: "Batrelio",
  legalName: TO_COMPLETE("raison sociale"),
  legalForm: TO_COMPLETE("forme juridique, ex. SAS"),
  // Only for a company: remove the line on the legal notice for a sole trader.
  shareCapital: TO_COMPLETE("capital social, ex. 1 000 €"),
  address: TO_COMPLETE("adresse du siège social"),
  siren: TO_COMPLETE("numéro SIREN"),
  registration: TO_COMPLETE("immatriculation, ex. RCS Paris ou registre national des entreprises"),
  vatNumber: TO_COMPLETE("numéro de TVA intracommunautaire"),
  publicationDirector: TO_COMPLETE("nom du directeur de la publication"),
  email: TO_COMPLETE("adresse e-mail de contact"),
  phone: TO_COMPLETE("numéro de téléphone"),
  // Where people send privacy requests (art. 12 to 22 RGPD).
  privacyEmail: TO_COMPLETE("adresse e-mail pour les données personnelles"),
  website: "https://batrelio.fr",
} as const;

// Hosting provider of the website, required on the legal notice (LCEN).
// Check the phone number on vercel.com before going live.
export const WEBSITE_HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  phone: "+1 951 383 6898",
  website: "https://vercel.com",
} as const;

export const CNIL = {
  address: "3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07",
  website: "https://www.cnil.fr",
  complaintUrl: "https://www.cnil.fr/fr/plaintes",
} as const;

// Bump the version whenever the terms change: signups record the version they accepted.
export const LEGAL_VERSION = "2026-10-29";
export const LEGAL_LAST_UPDATED = "29 octobre 2026";
