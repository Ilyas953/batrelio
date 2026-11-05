// Pages the artisan may be sent back to, with the name shown on the "←" link.
// Anything else falls back to the default, so a crafted value can never redirect
// outside the artisan space.
const RETURN_PAGES: Record<string, string> = {
  "/espace": "Demandes",
  "/espace/devis": "Devis",
  "/espace/reglages": "Réglages",
  "/espace/demarrage": "Mise en place",
  "/espace/reponse-automatique": "Réponse automatique",
  "/espace/messages": "Vos messages",
};

const QUOTE_PAGE = /^\/espace\/devis\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const QUOTE_PAGE_LABEL = "Le devis";

export type ReturnLink = { href: string; label: string };

function labelOf(path: string): string | null {
  if (QUOTE_PAGE.test(path)) return QUOTE_PAGE_LABEL;
  return Object.hasOwn(RETURN_PAGES, path) ? RETURN_PAGES[path] : null;
}

// The page to go back to, and how to name it: the requested one if known, else the fallback.
export function returnLink(value: unknown, fallback: string): ReturnLink {
  const label = typeof value === "string" ? labelOf(value) : null;
  if (label && typeof value === "string") return { href: value, label };
  return { href: fallback, label: labelOf(fallback) ?? RETURN_PAGES["/espace"] };
}

export function safeReturnTo(value: unknown, fallback: string): string {
  return returnLink(value, fallback).href;
}

// "/espace/entreprise" + "/espace/devis/…" -> "/espace/entreprise?retour=/espace/devis/…".
export function withReturnTo(path: string, returnTo: string): string {
  return `${path}?retour=${returnTo}`;
}
