import { describe, expect, it } from "vitest";
import {
  amountDueCents,
  formatInvoiceNumber,
  invoiceDueDate,
  invoiceShareText,
  listMissingBeforeIssuing,
  paymentTermsLabel,
  type InvoiceEditorInput,
} from "@/lib/invoices/invoice";

const READY: InvoiceEditorInput = {
  title: "Élagage",
  customerName: "Mme Facture",
  customerAddress: "1 rue du Test, Cergy",
  workCompletedOn: "2026-11-09",
  paymentDueDays: 0,
  depositReceivedCents: 30_000,
  notes: "",
  lines: [{ category: "labor", designation: "Élagage", quantity: 1, unit: "u", unitPriceCents: 100_000, vatRateBp: 0 }],
};

describe("invoice", () => {
  it("is numbered in one unbroken sequence per year", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("F2026-001");
    expect(formatInvoiceNumber(2026, 42)).toBe("F2026-042");
    expect(formatInvoiceNumber(2027, 1000)).toBe("F2027-1000");
  });

  it("can be issued once everything required is there", () => {
    expect(listMissingBeforeIssuing(READY, 100_000)).toEqual([]);
  });

  it("says what is missing before issuing", () => {
    const empty = { ...READY, customerName: "", customerAddress: "", workCompletedOn: "", lines: [] };
    expect(listMissingBeforeIssuing(empty, 0)).toEqual([
      "le nom du client",
      "son adresse",
      "au moins une ligne",
      "la date de fin des travaux",
      "un acompte reçu inférieur au total",
    ]);
    const unpriced = { ...READY, lines: [{ ...READY.lines[0], unitPriceCents: null }] };
    expect(listMissingBeforeIssuing(unpriced, 100_000)).toEqual(["le prix de chaque ligne"]);
  });

  it("deducts the deposit already received", () => {
    expect(amountDueCents(100_000, 30_000)).toBe(70_000);
    expect(amountDueCents(100_000, 0)).toBe(100_000);
    expect(amountDueCents(100_000, 120_000)).toBe(0);
  });

  it("is payable on receipt, or by a due date", () => {
    expect(invoiceDueDate("2026-11-10T10:00:00Z", 0)).toBeNull();
    expect(invoiceDueDate("2026-11-10T10:00:00Z", 30)?.toISOString()).toBe("2026-12-10T10:00:00.000Z");
    expect(paymentTermsLabel(0)).toBe("À réception");
    expect(paymentTermsLabel(30)).toBe("30 jours");
  });

  it("is sent with a short message and its link", () => {
    expect(invoiceShareText("Toitures Martin", "https://batrelio.com/facture/abc")).toBe(
      "Bonjour, voici la facture de Toitures Martin pour les travaux réalisés : https://batrelio.com/facture/abc Merci !",
    );
  });
});
