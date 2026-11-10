import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LEGAL_FORM_LABELS } from "@/lib/company/legal";
import { formatPrice } from "@/lib/format";
import { formatVatRate } from "@/lib/quotes/catalog";
import { companyAddress, formatLongDate, formatSiret, unitLabel } from "@/lib/documents/format";
import type { CompanySnapshot } from "@/lib/quotes/company-snapshot";
import { getPublicQuote, type PublicQuote } from "@/lib/quotes/queries";
import { computeTotals, lineTotalCents } from "@/lib/quotes/totals";
import { PrintButton } from "@/components/ui/PrintButton";

export const metadata: Metadata = {
  title: "Votre devis",
  // Private links: never indexed, never sent as referrer to other sites.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function addDays(isoDate: string, days: number): Date {
  return new Date(new Date(isoDate).getTime() + days * 24 * 60 * 60 * 1000);
}

export default function PublicQuotePage({ params }: PageProps<"/devis/[token]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 print:max-w-none print:p-0">
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement du devis…</p>}>
        {params.then(({ token }) => (
          <QuoteDocument token={token} />
        ))}
      </Suspense>
    </main>
  );
}

async function QuoteDocument({ token }: { token: string }) {
  const publicQuote = await getPublicQuote(token);
  if (!publicQuote) notFound();

  return (
    <>
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="space-y-8 rounded-3xl bg-white p-6 text-stone-800 shadow-sm ring-1 ring-stone-200 sm:p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <DocumentHeader publicQuote={publicQuote} />
        <LinesTable publicQuote={publicQuote} />
        <Conditions publicQuote={publicQuote} />
        <LegalMentions company={publicQuote.company} />
        <Acceptance />
        <WithdrawalForm company={publicQuote.company} />
      </article>
      <p className="mt-6 text-center text-sm text-stone-400 print:hidden">Devis établi avec Batrelio</p>
    </>
  );
}

function DocumentHeader({ publicQuote }: { publicQuote: PublicQuote }) {
  const { quote, company } = publicQuote;
  const sentAt = quote.sent_at;
  const chargesVat = company.vat_regime === "subject";

  return (
    <header className="space-y-6">
      <div className="flex flex-col justify-between gap-6 sm:flex-row">
        <div className="space-y-0.5 text-sm">
          {publicQuote.logoUrl && (
            // Private file behind a short-lived signed link: not for the shared image cache.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicQuote.logoUrl} alt={`Logo ${company.name}`} className="mb-3 max-h-20 max-w-56 object-contain" />
          )}
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
          {company.contact_phone && <p>Tél. {company.contact_phone.replace(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, "0$1 $2 $3 $4 $5")}</p>}
          {company.contact_email && <p>{company.contact_email}</p>}
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-3xl font-extrabold tracking-tight text-stone-900">DEVIS</p>
          <p className="font-semibold">N° {quote.number}</p>
          {sentAt && <p>Émis le {formatLongDate(new Date(sentAt))}</p>}
          {sentAt && <p>Valable jusqu&apos;au {formatLongDate(addDays(sentAt, quote.validity_days))}</p>}
          <p>Devis gratuit</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 text-sm sm:grid-cols-2 print:bg-transparent print:p-0">
        <div>
          <p className="font-semibold text-stone-500">Client</p>
          <p className="text-base font-semibold text-stone-900">{quote.customer_name}</p>
        </div>
        <div>
          <p className="font-semibold text-stone-500">Adresse du chantier</p>
          <p className="text-base text-stone-900">{quote.customer_address}</p>
        </div>
      </div>

      {quote.title && (
        <p className="text-lg">
          <span className="font-semibold">Objet : </span>
          {quote.title}
        </p>
      )}
    </header>
  );
}

function LinesTable({ publicQuote }: { publicQuote: PublicQuote }) {
  const { lines, company, quote } = publicQuote;
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
        <div className="flex justify-between border-t-2 border-stone-900 pt-1 text-base font-extrabold text-stone-900">
          <dt>{chargesVat ? "Total TTC" : "Total"}</dt>
          <dd className="tabular-nums">{formatPrice(quote.total_cents)}</dd>
        </div>
        {quote.deposit_cents !== null && quote.deposit_percent ? (
          <div className="flex justify-between">
            <dt>Acompte ({quote.deposit_percent} %)</dt>
            <dd className="tabular-nums">{formatPrice(quote.deposit_cents)}</dd>
          </div>
        ) : null}
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

function Conditions({ publicQuote }: { publicQuote: PublicQuote }) {
  const { quote } = publicQuote;

  return (
    <div className="space-y-5">
      <Section title="Réalisation des travaux">
        <p>
          Début estimé : {quote.work_start_date ? formatLongDate(new Date(`${quote.work_start_date}T12:00:00`)) : "à convenir ensemble"}
          {quote.work_duration ? ` · Durée estimée : ${quote.work_duration}` : ""}
        </p>
      </Section>
      <Section title="Paiement">
        <p>
          {quote.deposit_percent && quote.deposit_cents !== null
            ? `Acompte de ${quote.deposit_percent} %, soit ${formatPrice(quote.deposit_cents)}, à l'acceptation du devis ; solde à la fin des travaux.`
            : "Paiement à la fin des travaux."}{" "}
          Par virement ou par tout autre moyen convenu avec l&apos;entreprise.
        </p>
      </Section>
      {quote.waste_management && (
        <Section title="Gestion des déchets de chantier">
          <p className="whitespace-pre-line">{quote.waste_management}</p>
        </Section>
      )}
      {quote.notes && (
        <Section title="Remarques">
          <p className="whitespace-pre-line">{quote.notes}</p>
        </Section>
      )}
    </div>
  );
}

function LegalMentions({ company }: { company: CompanySnapshot }) {
  return (
    <div className="space-y-5">
      <Section title="Assurance professionnelle">
        <p>
          {company.insurer_name}
          {company.insurer_address ? `, ${company.insurer_address}` : ""} · Contrat n° {company.insurance_policy_number} ·
          Couverture : {company.insurance_coverage_area}
        </p>
      </Section>
      {company.mediator_name && (
        <Section title="Médiation de la consommation">
          <p>
            En cas de litige, vous pouvez recourir gratuitement au médiateur de la consommation : {company.mediator_name}
            {company.mediator_website ? ` (${company.mediator_website})` : ""}.
          </p>
        </Section>
      )}
      <Section title="Droit de rétractation">
        <p>
          Si vous êtes un consommateur et que ce contrat est conclu à distance ou hors établissement, vous disposez
          d&apos;un délai de quatorze jours à compter de sa conclusion pour vous rétracter, sans avoir à motiver votre
          décision (articles L. 221-18 et suivants du Code de la consommation). Pour l&apos;exercer, informez
          l&apos;entreprise de votre décision par une déclaration dénuée d&apos;ambiguïté, par exemple avec le formulaire
          ci-dessous.
        </p>
        <p>
          Si vous demandez expressément que les travaux commencent avant la fin de ce délai, vous paierez un montant
          proportionnel à ce qui aura été réalisé jusqu&apos;à votre rétractation (article L. 221-25). Le droit de
          rétractation ne s&apos;applique pas aux travaux d&apos;entretien ou de réparation à réaliser en urgence à votre
          domicile et expressément sollicités par vous (article L. 221-28).
        </p>
      </Section>
    </div>
  );
}

function Acceptance() {
  return (
    <section className="space-y-3 rounded-2xl border-2 border-stone-300 p-5 text-sm print:break-inside-avoid">
      <h2 className="text-base font-bold text-stone-900">Bon pour accord</h2>
      <p>
        Date et signature du client, précédées de la mention manuscrite « Devis reçu avant l&apos;exécution des travaux,
        bon pour accord » :
      </p>
      <div className="h-24" />
    </section>
  );
}

function WithdrawalForm({ company }: { company: CompanySnapshot }) {
  const recipient = [company.legal_name ?? company.name, companyAddress(company), company.contact_email].filter(Boolean).join(", ");

  return (
    <section className="space-y-2 border-t border-dashed border-stone-300 pt-6 text-sm print:break-before-page">
      <h2 className="text-base font-bold text-stone-900">Modèle de formulaire de rétractation</h2>
      <p className="italic">
        (Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)
      </p>
      <p>À l&apos;attention de {recipient} :</p>
      <p>
        Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat pour la prestation de
        services ci-dessous :
      </p>
      <p>Commandé le (*)/reçu le (*) :</p>
      <p>Nom du (des) consommateur(s) :</p>
      <p>Adresse du (des) consommateur(s) :</p>
      <p>Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) :</p>
      <p>Date :</p>
      <p className="italic">(*) Rayez la mention inutile.</p>
    </section>
  );
}
