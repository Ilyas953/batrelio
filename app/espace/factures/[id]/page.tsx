import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/espace/BackLink";
import { StatusPill, type Tone } from "@/components/espace/tones";
import { ShareLinkButtons } from "@/components/ui/ShareLinkButtons";
import { formatPrice } from "@/lib/format";
import { amountDueCents, invoiceDueDate, invoiceShareText } from "@/lib/invoices/invoice";
import { getInvoiceForEditor, type EditorInvoice } from "@/lib/invoices/queries";
import { getSiteOrigin } from "@/lib/requests/site-origin";
import { InvoiceEditor } from "./InvoiceEditor";
import { MarkPaidButton } from "./InvoiceButtons";

export const metadata: Metadata = {
  title: "Facture · Batrelio",
  robots: { index: false },
};

const STATUS: Record<EditorInvoice["invoice"]["status"], { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "amber" },
  issued: { label: "Émise, à encaisser", tone: "sky" },
  paid: { label: "Payée", tone: "emerald" },
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

export default function InvoicePage({ params }: PageProps<"/espace/factures/[id]">) {
  return (
    <>
      <BackLink href="/espace/devis#factures" label="Devis" />
      <Suspense fallback={<p className="mt-8 text-lg text-stone-500">Chargement de la facture…</p>}>
        {params.then(({ id }) => (
          <InvoiceScreen invoiceId={id} />
        ))}
      </Suspense>
    </>
  );
}

async function InvoiceScreen({ invoiceId }: { invoiceId: string }) {
  const editor = await getInvoiceForEditor(invoiceId);
  if (!editor) notFound();
  const { invoice } = editor;
  const status = STATUS[invoice.status];

  return (
    <div className="mt-4 space-y-6">
      <header>
        <p className="flex items-center gap-2 text-sm font-semibold text-stone-500">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          {invoice.number ? `Facture n° ${invoice.number}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">{invoice.title || "Facture"}</h1>
        {invoice.customer_name && <p className="mt-1 text-base text-stone-600">Pour {invoice.customer_name}</p>}
        <Link href={`/espace/devis/${invoice.quote_id}`} className="mt-2 inline-block text-base font-semibold text-orange-700 underline">
          Voir le devis{invoice.quote?.number ? ` n° ${invoice.quote.number}` : ""}
        </Link>
      </header>

      {invoice.status === "draft" ? <InvoiceEditor editor={editor} /> : <IssuedInvoice editor={editor} />}
    </div>
  );
}

async function IssuedInvoice({ editor }: { editor: EditorInvoice }) {
  const { invoice, companyName } = editor;
  const url = `${await getSiteOrigin()}/facture/${invoice.public_token}`;
  const due = invoice.issued_at ? invoiceDueDate(invoice.issued_at, invoice.payment_due_days) : null;

  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div>
        <p className="text-sm font-semibold text-stone-500">Reste à payer</p>
        <p className="text-3xl font-extrabold tabular-nums text-stone-900">
          {formatPrice(amountDueCents(invoice.total_cents, invoice.deposit_received_cents))}
        </p>
        <p className="text-base text-stone-600">
          Total {formatPrice(invoice.total_cents)}
          {invoice.deposit_received_cents ? ` · acompte reçu ${formatPrice(invoice.deposit_received_cents)}` : ""}
          {invoice.status === "issued" ? ` · ${due ? `à payer avant le ${dateFormatter.format(due)}` : "payable à réception"}` : ""}
        </p>
      </div>
      {invoice.status === "paid" && invoice.paid_at ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900">Payée le {dateFormatter.format(new Date(invoice.paid_at))} ✓</p>
      ) : (
        <MarkPaidButton invoiceId={invoice.id} />
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-14 items-center justify-center rounded-2xl bg-stone-900 px-5 text-lg font-semibold text-white hover:bg-stone-700"
      >
        Voir la facture comme le client
      </a>
      <ShareLinkButtons link={{ url, shareText: invoiceShareText(companyName, url), customerPhone: invoice.quote?.request?.customer_phone ?? null }} />
      <p className="text-sm text-stone-500">Une facture émise ne se modifie plus. En cas d&apos;erreur, une facture d&apos;avoir sera nécessaire.</p>
    </section>
  );
}
