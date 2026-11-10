// Invoices made from a quote: draft, numbering, frozen once issued, private, paid.
import { createServerClient } from "@supabase/ssr";
import { admin, IDENTITY, PUBLISHABLE_KEY, SUPABASE_URL } from "./helpers.mjs";

const INSURED = { insurer_name: "Assurance E2E", insurance_policy_number: "DEC-E2E", insurance_coverage_area: "France métropolitaine", mediator_name: "Médiateur E2E" };
const YEAR = new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", year: "numeric" }).format(new Date());

const clientFor = (jar) =>
  createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: () => {} } });

const line = (designation, unitPriceCents) => ({ category: "labor", designation, quantity: 1, unit: "u", unitPriceCents, vatRateBp: 0 });
const quoteInput = (lines) => ({ title: "Élagage", customerName: "Mme Facture", customerAddress: "1 rue du Test, Cergy", depositPercent: 30, validityDays: 30, workStartDate: "", workDuration: "1 jour", wasteManagement: "", notes: "", lines });
const invoiceInput = (overrides = {}) => ({
  title: "Élagage", customerName: "Mme Facture", customerAddress: "1 rue du Test, Cergy", workCompletedOn: "2026-11-09",
  paymentDueDays: 30, depositReceivedCents: 30_000, notes: "", lines: [line("Élagage chêne", 100_000), line("Évacuation", 20_000)], ...overrides,
});

export async function invoicesSuite({ check, makeUser, get, action }) {
  const artisan = await makeUser({ test: true, companyName: "Factures E2E" });
  const company = artisan.company;
  await admin.from("companies").update({ ...IDENTITY, ...INSURED }).eq("id", company.id);
  const readInvoice = async (id) => (await admin.from("invoices").select("*").eq("id", id).single()).data;

  const { data: request } = await admin
    .from("requests")
    .insert({ company_id: company.id, source: "link", customer_phone: "+33639985561", customer_name: "Mme Facture", description: "Élagage", status: "new" })
    .select("id")
    .single();
  const { data: draftQuote } = await admin.from("quotes").insert({ company_id: company.id, request_id: request.id, total_cents: 0 }).select("id").single();
  let result = await action("createInvoiceFromQuote", "/espace/devis", { jar: artisan.jar, args: [draftQuote.id] });
  check("pas de facture depuis un devis pas encore envoyé", result.text.includes("Envoyez d'abord le devis"));

  await action("sendQuote", `/espace/devis/${draftQuote.id}`, { jar: artisan.jar, args: [draftQuote.id, quoteInput([line("Élagage chêne", 100_000)])] });
  result = await action("createInvoiceFromQuote", `/espace/devis/${draftQuote.id}`, { jar: artisan.jar, args: [draftQuote.id] });
  const invoiceId = result.redirect?.match(/\/espace\/factures\/([0-9a-f-]{36})/)?.[1];
  const { data: copiedLines } = await admin.from("invoice_lines").select("designation, unit_price_cents").eq("invoice_id", invoiceId ?? "");
  let invoice = invoiceId ? await readInvoice(invoiceId) : null;
  check(
    "« Faire la facture » : brouillon avec le client et les lignes du devis",
    invoice?.status === "draft" && invoice.customer_name === "Mme Facture" && copiedLines?.length === 1 && copiedLines[0].unit_price_cents === 100_000,
    result.redirect ?? result.text.slice(-200),
  );
  result = await action("createInvoiceFromQuote", `/espace/devis/${draftQuote.id}`, { jar: artisan.jar, args: [draftQuote.id] });
  check("un seul brouillon à la fois : on le rouvre", result.redirect?.includes(invoiceId));

  result = await action("saveInvoice", `/espace/factures/${invoiceId}`, { jar: artisan.jar, args: [invoiceId, invoiceInput()] });
  invoice = await readInvoice(invoiceId);
  check("brouillon modifiable : travaux en plus et acompte", result.text.includes("savedAt") && invoice.total_cents === 120_000 && invoice.deposit_received_cents === 30_000);

  result = await action("issueInvoice", `/espace/factures/${invoiceId}`, { jar: artisan.jar, args: [invoiceId, invoiceInput({ workCompletedOn: "" })] });
  check("émission refusée sans date de fin des travaux", result.text.includes("date de fin des travaux") && (await readInvoice(invoiceId)).status === "draft");
  result = await action("issueInvoice", `/espace/factures/${invoiceId}`, { jar: artisan.jar, args: [invoiceId, invoiceInput()] });
  invoice = await readInvoice(invoiceId);
  check(
    "facture émise : numéro F-année-001, figée avec les mentions de l'entreprise",
    invoice.status === "issued" && invoice.number === `F${YEAR}-001` && invoice.company_snapshot?.siret === IDENTITY.siret && result.text.includes(`/facture/${invoice.public_token}`),
    JSON.stringify({ status: invoice.status, number: invoice.number }),
  );

  // Frozen: neither the app nor the database lets an issued invoice change.
  result = await action("saveInvoice", `/espace/factures/${invoiceId}`, { jar: artisan.jar, args: [invoiceId, invoiceInput({ depositReceivedCents: 0 })] });
  check("facture émise : plus modifiable dans l'appli", result.text.includes("déjà été émise") && (await readInvoice(invoiceId)).deposit_received_cents === 30_000);
  const db = clientFor(artisan.jar);
  await db.from("invoices").update({ total_cents: 1 }).eq("id", invoiceId);
  const statusChange = await db.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
  check("facture émise : ni montant ni statut modifiables en base", (await readInvoice(invoiceId)).total_cents === 120_000 && statusChange.error !== null);
  const deletion = await db.from("invoices").delete().eq("id", invoiceId).select("id");
  check("facture émise : impossible à supprimer", (deletion.data ?? []).length === 0 && Boolean(await readInvoice(invoiceId)));

  // The next invoice takes the next number.
  result = await action("createInvoiceFromQuote", `/espace/devis/${draftQuote.id}`, { jar: artisan.jar, args: [draftQuote.id] });
  const secondId = result.redirect?.match(/\/espace\/factures\/([0-9a-f-]{36})/)?.[1];
  await action("issueInvoice", `/espace/factures/${secondId}`, { jar: artisan.jar, args: [secondId, invoiceInput({ depositReceivedCents: 0 })] });
  check("numérotation suivie, sans trou", (await readInvoice(secondId)).number === `F${YEAR}-002`);

  // What the customer sees.
  let page = await get(`/facture/${invoice.public_token}`);
  const text = page.text.replaceAll("<!-- -->", "");
  check(
    "page client : facture complète avec les mentions obligatoires",
    page.status === 200 && text.includes("FACTURE") && text.includes(`N° F${YEAR}-001`) && text.includes("Reste à payer") && text.includes("Acompte déjà versé") &&
      text.includes("trois fois le taux d") && text.includes("40 €") && text.includes("SIRET") && text.includes("Assurance E2E") && text.includes("Travaux terminés le"),
  );
  const { data: thirdDraft } = await admin.from("invoices").insert({ company_id: company.id, quote_id: draftQuote.id }).select("id, public_token").single();
  page = await get(`/facture/${thirdDraft.public_token}`);
  check("page client : un brouillon n'est jamais visible", !page.text.includes("FACTURE"));
  await admin.from("invoices").delete().eq("id", thirdDraft.id);

  // Private to the artisan.
  const other = await makeUser({ test: true, companyName: "Voisin Factures E2E" });
  page = await get(`/espace/factures/${invoiceId}`, other.jar);
  check("un autre artisan ne voit pas la facture", !page.text.includes("Mme Facture"));
  result = await action("createInvoiceFromQuote", "/espace/devis", { jar: other.jar, args: [draftQuote.id] });
  check("un autre artisan ne peut pas facturer ce devis", result.text.includes("Devis introuvable"));
  result = await action("markInvoicePaid", `/espace/factures/${invoiceId}`, { jar: other.jar, args: [invoiceId] });
  check("un autre artisan ne peut pas la marquer payée", (await readInvoice(invoiceId)).status === "issued");

  // Paid.
  result = await action("markInvoicePaid", `/espace/factures/${invoiceId}`, { jar: artisan.jar, args: [invoiceId] });
  invoice = await readInvoice(invoiceId);
  check("« Le client a payé » : facture payée", invoice.status === "paid" && invoice.paid_at !== null);
  page = await get(`/facture/${invoice.public_token}`);
  check("page client : facture acquittée", page.text.replaceAll("<!-- -->", "").includes("Facture acquittée le"));

  page = await get("/espace/devis", artisan.jar);
  check("onglet Devis : section Factures avec leur numéro", page.text.includes("Factures") && page.text.replaceAll("<!-- -->", "").includes(`F${YEAR}-001`));
  page = await get(`/espace/devis/${draftQuote.id}`, artisan.jar);
  check(
    "devis : ses factures et « Faire une autre facture »",
    page.text.replaceAll("<!-- -->", "").includes(`Facture n° F${YEAR}-001`) && page.text.includes("Faire une autre facture"),
  );
}
