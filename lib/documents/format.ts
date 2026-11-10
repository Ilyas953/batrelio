import { UNIT_LABELS, type QuoteUnit } from "@/lib/quotes/catalog";
import type { CompanySnapshot } from "@/lib/quotes/company-snapshot";

// Shared by the documents customers receive: quotes and invoices.

const longDateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

export function formatSiret(siret: string | null): string | null {
  return siret ? siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4") : null;
}

export function companyAddress(company: CompanySnapshot): string {
  return [company.address_line, [company.postal_code, company.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit as QuoteUnit] ?? unit;
}

export function formatContactPhone(phone: string): string {
  return phone.replace(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, "0$1 $2 $3 $4 $5");
}
