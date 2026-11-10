import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/espace/BackLink";
import { QuoteStatusPill } from "@/components/espace/places";
import { ShareLinkButtons } from "@/components/ui/ShareLinkButtons";
import { formatPrice } from "@/lib/format";
import { withReturnTo } from "@/lib/espace/return-to";
import { getQuoteForEditor, type EditorQuote } from "@/lib/quotes/queries";
import { quoteShareText } from "@/lib/quotes/share-message";
import { getSiteOrigin } from "@/lib/requests/site-origin";
import { MakeInvoiceButton } from "../../factures/[id]/InvoiceButtons";
import { QuoteEditor } from "./QuoteEditor";

export default function QuotePage({ params }: PageProps<"/espace/devis/[id]">) {
  return (
    <>
      <BackLink href="/espace/devis" label="Devis" />
      <Suspense fallback={<p className="mt-8 text-lg text-stone-500">Chargement du devis…</p>}>
        {params.then(({ id }) => (
          <QuoteScreen quoteId={id} />
        ))}
      </Suspense>
    </>
  );
}

async function QuoteScreen({ quoteId }: { quoteId: string }) {
  const editor = await getQuoteForEditor(quoteId);
  if (!editor) notFound();
  const { quote } = editor;

  return (
    <div className="mt-4 space-y-6">
      <header>
        <p className="flex items-center gap-2 text-sm font-semibold text-stone-500">
          <QuoteStatusPill status={quote.status} />
          {quote.number ? `Devis n° ${quote.number}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">
          {quote.title || "Nouveau devis"}
        </h1>
        {quote.customer_name && <p className="mt-1 text-base text-stone-600">Pour {quote.customer_name}</p>}
        <Link href={`/espace/demandes/${quote.request_id}`} className="mt-2 inline-block text-base font-semibold text-orange-700 underline">
          Voir la demande du client
        </Link>
      </header>

      {quote.status === "draft" ? <QuoteEditor editor={editor} /> : <SentQuote editor={editor} />}
    </div>
  );
}

async function SentQuote({ editor }: { editor: EditorQuote }) {
  const { quote, companyName, quoteMessage } = editor;
  const url = `${await getSiteOrigin()}/devis/${quote.public_token}`;

  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <p className="text-3xl font-extrabold tabular-nums text-stone-900">{formatPrice(quote.total_cents)}</p>
      <p className="text-base text-stone-600">Ce devis a été envoyé : il ne peut plus être modifié.</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-14 items-center justify-center rounded-2xl bg-stone-900 px-5 text-lg font-semibold text-white hover:bg-stone-700"
      >
        Voir le devis comme le client
      </a>
      <ShareLinkButtons
        link={{
          url,
          customerPhone: quote.request.customer_phone,
          shareText: quoteShareText({ name: companyName, quote_message: quoteMessage }, url),
        }}
      />
      {(quote.status === "sent" || quote.status === "signed") && <InvoicesOfQuote quote={quote} />}
      <Link href={withReturnTo("/espace/messages", `/espace/devis/${quote.id}`)} className="block text-center text-base font-semibold text-orange-700 underline">
        Modifier le message d&apos;envoi
      </Link>
    </section>
  );
}

const INVOICE_LABELS = { draft: "Brouillon", issued: "Émise", paid: "Payée" } as const;

// Once the work is done: the invoice, made from this quote.
function InvoicesOfQuote({ quote }: { quote: EditorQuote["quote"] }) {
  const draft = quote.invoices.find((invoice) => invoice.status === "draft");
  return (
    <div className="space-y-2 border-t border-stone-200 pt-4">
      {quote.invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/espace/factures/${invoice.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200 hover:ring-stone-300"
        >
          <span className="font-semibold text-stone-900">
            Facture {invoice.number ? `n° ${invoice.number}` : ""} · {INVOICE_LABELS[invoice.status]}
          </span>
          <span className="font-bold tabular-nums">{formatPrice(invoice.total_cents)}</span>
        </Link>
      ))}
      {!draft && <MakeInvoiceButton quoteId={quote.id} label={quote.invoices.length ? "Faire une autre facture" : "Travaux finis : faire la facture"} />}
    </div>
  );
}
