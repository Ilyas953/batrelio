import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShareLinkButtons } from "@/components/ui/ShareLinkButtons";
import { formatPrice } from "@/lib/format";
import { getQuoteForEditor, type EditorQuote } from "@/lib/quotes/queries";
import { quoteShareText } from "@/lib/quotes/share-message";
import { getSiteOrigin } from "@/lib/requests/site-origin";
import { QuoteEditor } from "./QuoteEditor";

const STATUS_LABELS = { draft: "Brouillon", sent: "Envoyé", signed: "Signé", declined: "Refusé" } as const;

export default function QuotePage({ params }: PageProps<"/espace/devis/[id]">) {
  return (
    <>
      <Link href="/espace" className="text-base font-semibold text-stone-500 hover:text-stone-900">
        ← Retour
      </Link>
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
        <p className="text-sm font-semibold text-orange-700">
          {STATUS_LABELS[quote.status]}
          {quote.number ? ` · Devis n° ${quote.number}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">
          {quote.title || "Nouveau devis"}
        </h1>
        {quote.customer_name && <p className="mt-1 text-base text-stone-600">Pour {quote.customer_name}</p>}
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
      <Link href="/espace/messages" className="block text-center text-base font-semibold text-orange-700 underline">
        Modifier le message d&apos;envoi
      </Link>
    </section>
  );
}
