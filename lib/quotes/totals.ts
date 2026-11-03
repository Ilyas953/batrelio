// Quote arithmetic, in cents. Shared by the editor (live totals) and the server (stored totals),
// so the artisan always sees exactly what the customer will receive.

export type PricedLine = { quantity: number; unitPriceCents: number | null; vatRateBp: number };

export type VatLine = { rateBp: number; baseCents: number; vatCents: number };

export type QuoteTotals = {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  vatBreakdown: VatLine[];
};

export function lineTotalCents(line: Pick<PricedLine, "quantity" | "unitPriceCents">): number {
  return Math.round(line.quantity * (line.unitPriceCents ?? 0));
}

// VAT is computed per rate on the summed base, as on an invoice.
export function computeTotals(lines: PricedLine[], chargesVat: boolean): QuoteTotals {
  const baseByRate = new Map<number, number>();
  for (const line of lines) {
    const rateBp = chargesVat ? line.vatRateBp : 0;
    baseByRate.set(rateBp, (baseByRate.get(rateBp) ?? 0) + lineTotalCents(line));
  }

  const vatBreakdown = [...baseByRate.entries()]
    .filter(([rateBp]) => rateBp > 0)
    .sort(([a], [b]) => b - a)
    .map(([rateBp, baseCents]) => ({ rateBp, baseCents, vatCents: Math.round((baseCents * rateBp) / 10_000) }));

  const subtotalCents = [...baseByRate.values()].reduce((sum, cents) => sum + cents, 0);
  const vatCents = vatBreakdown.reduce((sum, line) => sum + line.vatCents, 0);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents, vatBreakdown };
}

export function depositCents(totalCents: number, depositPercent: number | null): number | null {
  if (!depositPercent) return null;
  return Math.round((totalCents * depositPercent) / 100);
}

// "12,50", "12.5", "1 250" -> cents. Null for an empty field, NaN for anything else.
export function parseEurosInput(input: string): number | null {
  const normalized = input.replace(/[\s €]/g, "").replace(",", ".");
  if (!normalized) return null;
  if (!/^[0-9]+(\.[0-9]{0,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number(normalized) * 100);
}

// "2,5" -> 2.5. NaN when it is not a positive number.
export function parseQuantityInput(input: string): number {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  return /^[0-9]+(\.[0-9]{0,2})?$/.test(normalized) ? Number(normalized) : Number.NaN;
}

export function centsToInput(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2, useGrouping: false });
}
