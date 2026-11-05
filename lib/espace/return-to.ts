// Pages a form may send the artisan back to. Anything else falls back to the default,
// so a crafted value can never redirect outside the artisan space.
const RETURN_PAGES = new Set(["/espace", "/espace/demarrage"]);

export function safeReturnTo(value: unknown, fallback: string): string {
  return typeof value === "string" && RETURN_PAGES.has(value) ? value : fallback;
}
