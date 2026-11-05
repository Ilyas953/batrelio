import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckIcon, ClockIcon, DocumentIcon, SignatureIcon } from "@/components/landing/icons";
import { PageTitle } from "@/components/espace/places";
import { QuoteRow, Section } from "@/components/espace/lists";
import { formatCents, formatTimeAgo } from "@/lib/format";
import { getQuotesOverview, type ListedQuote } from "@/lib/espace/quotes";

export const metadata: Metadata = {
  title: "Devis · Batrelio",
  robots: { index: false },
};

export default function QuotesPage() {
  return (
    <>
      <PageTitle place="quotes" intro="Pour faire un devis, ouvrez une demande et touchez « Faire le devis »." />
      <Suspense fallback={<QuotesSkeleton />}>
        <QuoteLists />
      </Suspense>
    </>
  );
}

async function QuoteLists() {
  const { drafts, sent, signed } = await getQuotesOverview();
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
    </div>
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
