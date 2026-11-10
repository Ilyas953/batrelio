import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckIcon, ClockIcon, DocumentIcon, ReceiptIcon, SignatureIcon } from "@/components/landing/icons";
import { PageTitle } from "@/components/espace/places";
import { QuoteRow, Section } from "@/components/espace/lists";
import { formatCents, formatTimeAgo } from "@/lib/format";
import { getQuotesOverview, type ListedInvoice, type ListedQuote } from "@/lib/espace/quotes";
import { IconTile, StatusPill } from "@/components/espace/tones";
import { amountDueCents } from "@/lib/invoices/invoice";

export const metadata: Metadata = {
  title: "Devis · Batrelio",
  robots: { index: false },
};

export default function QuotesPage() {
  return (
    <>
      <PageTitle place="quotes" intro="Pour faire un devis, ouvrez une demande et touchez « Faire le devis »." />
      <Link href="/espace/prix" className="-mt-5 mb-8 inline-flex min-h-11 items-center gap-2 text-base font-semibold text-emerald-800 underline">
        Mes prix habituels →
      </Link>
      <Suspense fallback={<QuotesSkeleton />}>
        <QuoteLists />
      </Suspense>
    </>
  );
}

async function QuoteLists() {
  const { drafts, sent, signed, invoices } = await getQuotesOverview();
  const now = new Date();

  return (
    <div className="space-y-8">
      {drafts.length > 0 && (
        <Section
          id="brouillons"
          title="À terminer"
          count={drafts.length}
          icon={<SignatureIcon />}
          tone="amber"
          highlight
          empty={NO_EMPTY_STATE}
        >
          {drafts.map((quote) => (
            <QuoteRow key={quote.id} quote={quote} status="draft" detail={`Brouillon · modifié ${formatTimeAgo(quote.updated_at, now)}`} />
          ))}
        </Section>
      )}

      <Section
        id="en-attente"
        title="En attente de signature"
        count={sent.length}
        icon={<ClockIcon />}
        tone="sky"
        empty={{
          icon: <DocumentIcon className="size-7" />,
          title: "Aucun devis en attente",
          detail: "Les devis envoyés à vos clients apparaîtront ici jusqu'à leur signature.",
        }}
      >
        {sent.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} status="sent" detail={quote.sent_at ? `Envoyé ${formatTimeAgo(quote.sent_at, now)}` : "Envoyé"} />
        ))}
      </Section>

      <Section
        id="signes"
        title="Signés"
        count={signed.length}
        icon={<CheckIcon />}
        tone="emerald"
        empty={{
          icon: <CheckIcon className="size-7" />,
          title: "Aucun devis signé pour l'instant",
          detail: "Vos devis signés et leurs acomptes s'afficheront ici.",
        }}
      >
        {signed.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} status="signed" detail={formatDeposit(quote)} />
        ))}
      </Section>
      <Section
        id="factures"
        title="Factures"
        count={invoices.length}
        icon={<ReceiptIcon />}
        tone="violet"
        empty={{
          icon: <ReceiptIcon className="size-7" />,
          title: "Aucune facture pour l'instant",
          detail: "Les travaux finis ? Ouvrez le devis et touchez « Faire la facture ».",
        }}
      >
        {invoices.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} now={now} />
        ))}
      </Section>
    </div>
  );
}

const INVOICE_STATUS = {
  draft: { label: "Brouillon", tone: "amber" },
  issued: { label: "À encaisser", tone: "sky" },
  paid: { label: "Payée", tone: "emerald" },
} as const;

function InvoiceRow({ invoice, now }: { invoice: ListedInvoice; now: Date }) {
  const status = INVOICE_STATUS[invoice.status];
  const when = invoice.paid_at ?? invoice.issued_at ?? invoice.updated_at;
  return (
    <li>
      <Link
        href={`/espace/factures/${invoice.id}`}
        className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition hover:ring-stone-300 sm:p-5"
      >
        <IconTile tone={status.tone}>
          <ReceiptIcon />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-stone-900">{invoice.customer_name ?? "Client"}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            {invoice.number ? `n° ${invoice.number} · ` : ""}
            {formatTimeAgo(when, now)}
          </p>
        </div>
        <p className="shrink-0 text-xl font-extrabold tabular-nums text-stone-900">
          {formatCents(invoice.status === "paid" ? invoice.total_cents : amountDueCents(invoice.total_cents, invoice.deposit_received_cents))}
        </p>
      </Link>
    </li>
  );
}

const NO_EMPTY_STATE = { icon: null, title: "", detail: "" };

function formatDeposit(quote: ListedQuote): string {
  if (!quote.deposit_cents) return "Sans acompte";
  const deposit = formatCents(quote.deposit_cents);
  return quote.deposit_paid_at ? `Acompte de ${deposit} reçu` : `Acompte de ${deposit} en attente`;
}

function QuotesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de vos devis" className="animate-pulse space-y-3">
      <div className="h-7 w-48 rounded-full bg-stone-200" />
      <div className="h-20 rounded-3xl bg-stone-200" />
      <div className="h-20 rounded-3xl bg-stone-200" />
    </div>
  );
}
