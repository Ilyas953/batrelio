// Identity of the company that publishes and sells Batrelio, printed on every legal page.
// Values in brackets must be filled in before going live: a legal page with a missing
// mention is not compliant (loi n° 2004-575 du 21 juin 2004, LCEN).

import { PRODUCTION_SITE_URL } from "@/lib/site";

const TO_COMPLETE = (what: string) => `[À compléter : ${what}]`;

// Batrelio is published by a sole trader (entreprise individuelle, SIREN 132 122 201, created on
// 24 October 2026). The name must read "First name Last name EI" (loi n° 2022-172 du 14 février 2022).
// A sole trader has no share capital.
export const PUBLISHER = {
  brand: "Batrelio",
  legalName: TO_COMPLETE("prénom et nom, suivis de « EI »"),
  legalForm: "Entreprise individuelle (EI)",
  shareCapital: null as string | null,
  // A professional publisher must display an address: the registered one, or a domiciliation.
  address: TO_COMPLETE("adresse de l'entreprise"),
  siren: "132 122 201",
  registration: "Registre national des entreprises (RNE)",
  // Micro-entreprise under the VAT franchise (franchise en base, art. 293 B du CGI): no VAT is
  // charged and every price and invoice must say so. Switch to "subject" if turnover exceeds
  // the franchise threshold, and add the VAT number.
  vatRegime: "franchise" as "franchise" | "subject",
  vatNumber: null as string | null,
  publicationDirector: TO_COMPLETE("nom du directeur de la publication"),
  email: "contact@batrelio.com",
  phone: TO_COMPLETE("numéro de téléphone"),
  // Where people send privacy requests (art. 12 to 22 RGPD).
  privacyEmail: "contact@batrelio.com",
  website: PRODUCTION_SITE_URL,
} as const;

export const VAT_FRANCHISE_MENTION = "TVA non applicable, art. 293 B du CGI";

export function isVatFranchise(): boolean {
  return PUBLISHER.vatRegime === "franchise";
}

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
export const LEGAL_LAST_UPDATED = "30 octobre 2026";
