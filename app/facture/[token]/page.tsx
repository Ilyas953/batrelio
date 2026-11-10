import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/ui/PrintButton";
import { LEGAL_FORM_LABELS } from "@/lib/company/legal";
import { companyAddress, formatContactPhone, formatLongDate, formatSiret, unitLabel } from "@/lib/documents/format";
import { formatPrice } from "@/lib/format";
import { amountDueCents, invoiceDueDate } from "@/lib/invoices/invoice";
import { getPublicInvoice, type PublicInvoice } from "@/lib/invoices/queries";
import { formatVatRate } from "@/lib/quotes/catalog";
import { computeTotals, lineTotalCents } from "@/lib/quotes/totals";

export const metadata: Metadata = {
  title: "Votre facture",
  // Private links: never indexed, never sent as referrer to other sites.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PublicInvoicePage({ params }: PageProps<"/facture/[token]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 print:max-w-none print:p-0">
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement de la facture…</p>}>
        {params.then(({ token }) => (
          <InvoiceDocument token={token} />
        ))}
      </Suspense>
    </main>
  );
}

async function InvoiceDocument({ token }: { token: string }) {
  const publicInvoice = await getPublicInvoice(token);
  if (!publicInvoice) notFound();

  return (
    <>
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="space-y-8 rounded-3xl bg-white p-6 text-stone-800 shadow-sm ring-1 ring-stone-200 sm:p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <DocumentHeader publicInvoice={publicInvoice} />
        <LinesTable publicInvoice={publicInvoice} />
        <Payment publicInvoice={publicInvoice} />
        <LegalMentions publicInvoice={publicInvoice} />
      </article>
      <p className="mt-6 text-center text-sm text-stone-400 print:hidden">Facture établie avec Batrelio</p>
    </>
  );
}

function DocumentHeader({ publicInvoice }: { publicInvoice: PublicInvoice }) {
  const { invoice, company } = publicInvoice;
  const chargesVat = company.vat_regime === "subject";

  return (
    <header className="space-y-6">
      <div className="flex flex-col justify-between gap-6 sm:flex-row">
        <div className="space-y-0.5 text-sm">
          <p className="text-2xl font-extrabold text-stone-900">{company.name}</p>
          {company.legal_name && (
            <p>
              {company.legal_name}
              {company.legal_form ? ` · ${LEGAL_FORM_LABELS[company.legal_form]}` : ""}
            </p>
          )}
          <p>{companyAddress(company)}</p>
          {company.siret && <p>SIRET {formatSiret(company.siret)}</p>}
          {company.share_capital_cents !== null && <p>Capital social : {formatPrice(company.share_capital_cents)}</p>}
          <p>{chargesVat ? `N° TVA intracommunautaire : ${company.vat_number ?? ""}` : "TVA non applicable, art. 293 B du CGI"}</p>
          {company.contact_phone && <p>Tél. {formatContactPhone(company.contact_phone)}</p>}
          {company.contact_email && <p>{company.contact_email}</p>}
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-3xl font-extrabold tracking-tight text-stone-900">FACTURE</p>
          <p className="font-semibold">N° {invoice.number}</p>
          {invoice.issued_at && <p>Émise le {formatLongDate(new Date(invoice.issued_at))}</p>}
          {invoice.work_completed_on && <p>Travaux terminés le {formatLongDate(new Date(`${invoice.work_completed_on}T12:00:00`))}</p>}
          {invoice.quote?.number && <p>Devis n° {invoice.quote.number}</p>}
        </div>
      </div>

      <div className="rounded-2xl bg-stone-50 p-4 text-sm print:bg-transparent print:p-0">
        <p className="font-semibold text-stone-500">Client</p>
        <p className="text-base font-semibold text-stone-900">{invoice.customer_name}</p>
        <p className="text-base text-stone-900">{invoice.customer_address}</p>
      </div>

      {invoice.title && (
        <p className="text-lg">
          <span className="font-semibold">Objet : </span>
          {invoice.title}
        </p>
      )}
    </header>
  );
}

function LinesTable({ publicInvoice }: { publicInvoice: PublicInvoice }) {
  const { lines, company, invoice } = publicInvoice;
  const chargesVat = company.vat_regime === "subject";
  const totals = computeTotals(
    lines.map((line) => ({ quantity: Number(line.quantity), unitPriceCents: line.unit_price_cents, vatRateBp: line.vat_rate_bp })),
    chargesVat,
  );

  return (
    <section className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-stone-900 text-left">
              <th className="py-2 pr-3 font-semibold">Désignation</th>
              <th className="py-2 pr-3 text-right font-semibold">Qté</th>
              <th className="py-2 pr-3 font-semibold">Unité</th>
              <th className="py-2 pr-3 text-right font-semibold">Prix unitaire{chargesVat ? " HT" : ""}</th>
              {chargesVat && <th className="py-2 pr-3 text-right font-semibold">TVA</th>}
              <th className="py-2 text-right font-semibold">Total{chargesVat ? " HT" : ""}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-stone-200 align-top">
                <td className="py-2 pr-3 whitespace-pre-line">{line.designation}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{Number(line.quantity).toLocaleString("fr-FR")}</td>
                <td className="py-2 pr-3">{unitLabel(line.unit)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatPrice(line.unit_price_cents ?? 0)}</td>
                {chargesVat && <td className="py-2 pr-3 text-right tabular-nums">{formatVatRate(line.vat_rate_bp)}</td>}
                <td className="py-2 text-right tabular-nums">
                  {formatPrice(lineTotalCents({ quantity: Number(line.quantity), unitPriceCents: line.unit_price_cents }))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
        {chargesVat && (
          <>
            <div className="flex justify-between">
              <dt>Total HT</dt>
              <dd className="tabular-nums">{formatPrice(totals.subtotalCents)}</dd>
            </div>
            {totals.vatBreakdown.map((vat) => (
              <div key={vat.rateBp} className="flex justify-between">
                <dt>TVA {formatVatRate(vat.rateBp)}</dt>
                <dd className="tabular-nums">{formatPrice(vat.vatCents)}</dd>
              </div>
            ))}
          </>
        )}
        <div className="flex justify-between border-t-2 border-stone-900 pt-1 font-bold text-stone-900">
          <dt>{chargesVat ? "Total TTC" : "Total"}</dt>
          <dd className="tabular-nums">{formatPrice(invoice.total_cents)}</dd>
        </div>
        {invoice.deposit_received_cents > 0 && (
          <div className="flex justify-between">
            <dt>Acompte déjà versé</dt>
            <dd className="tabular-nums">− {formatPrice(invoice.deposit_received_cents)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-stone-300 pt-1 text-base font-extrabold text-stone-900">
          <dt>{invoice.status === "paid" ? "Payé" : "Reste à payer"}</dt>
          <dd className="tabular-nums">{formatPrice(amountDueCents(invoice.total_cents, invoice.deposit_received_cents))}</dd>
        </div>
      </dl>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1 text-sm leading-relaxed">
      <h2 className="text-base font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

function Payment({ publicInvoice }: { publicInvoice: PublicInvoice }) {
  const { invoice } = publicInvoice;
  const due = invoice.issued_at ? invoiceDueDate(invoice.issued_at, invoice.payment_due_days) : null;

  return (
    <div className="space-y-5">
      <Section title="Paiement">
        {invoice.status === "paid" && invoice.paid_at ? (
          <p className="font-semibold">Facture acquittée le {formatLongDate(new Date(invoice.paid_at))}.</p>
        ) : (
          <p>
            {due ? `À régler au plus tard le ${formatLongDate(due)}` : "Payable à réception"}, par virement ou par tout autre moyen
            convenu avec l&apos;entreprise.
          </p>
        )}
        <p>
          En cas de retard de paiement, des pénalités sont dues au taux de trois fois le taux d&apos;intérêt légal. Pour un
          client professionnel, une indemnité forfaitaire de 40 € pour frais de recouvrement est également due (articles L. 441-10
          et D. 441-5 du Code de commerce). Pas d&apos;escompte pour paiement anticipé.
        </p>
      </Section>
      {invoice.notes && (
        <Section title="Remarques">
          <p className="whitespace-pre-line">{invoice.notes}</p>
        </Section>
      )}
    </div>
  );
}

function LegalMentions({ publicInvoice }: { publicInvoice: PublicInvoice }) {
  const { company } = publicInvoice;
  return (
    <div className="space-y-5">
      {company.insurer_name && (
        <Section title="Assurance professionnelle">
          <p>
            {company.insurer_name}
            {company.insurer_address ? `, ${company.insurer_address}` : ""} · Contrat n° {company.insurance_policy_number} ·
            Couverture : {company.insurance_coverage_area}
          </p>
        </Section>
      )}
      {company.mediator_name && (
        <Section title="Médiation de la consommation">
          <p>
            En cas de litige, vous pouvez recourir gratuitement au médiateur de la consommation : {company.mediator_name}
            {company.mediator_website ? ` (${company.mediator_website})` : ""}.
          </p>
        </Section>
      )}
    </div>
  );
}
