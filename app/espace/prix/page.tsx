import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/espace/BackLink";
import { PageTitle } from "@/components/espace/places";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { CATEGORY_LABELS, QUOTE_LINE_CATEGORIES, formatVatRate } from "@/lib/quotes/catalog";
import type { PriceItem } from "@/lib/quotes/price-list";
import { PriceItemForm, PriceItemRow } from "./PriceItemForm";

export const metadata: Metadata = {
  title: "Mes prix · Batrelio",
  robots: { index: false },
};

export default function PriceListPage() {
  return (
    <>
      <BackLink href="/espace/reglages" label="Réglages" />
      <PageTitle
        place="prices"
        intro="Les lignes de vos devis envoyés sont retenues ici, avec leur prix. Batrelio les reprend pour préparer vos prochains devis : vous n'avez plus qu'à vérifier les quantités."
      />
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <PriceList />
      </Suspense>
    </>
  );
}

function summaryOf(item: PriceItem & { use_count: number }, chargesVat: boolean): string {
  const price = `${formatPrice(item.unit_price_cents)}${chargesVat ? " HT" : ""} / ${item.unit}`;
  const vat = chargesVat ? ` · TVA ${formatVatRate(item.vat_rate_bp)}` : "";
  const uses = item.use_count > 0 ? ` · utilisée ${item.use_count} fois` : "";
  return `${price}${vat}${uses}`;
}

async function PriceList() {
  const { supabase } = await requireUser();
  const [{ data: company }, { data: items }] = await Promise.all([
    supabase.from("companies").select("vat_regime").maybeSingle(),
    supabase
      .from("price_items")
      .select("id, category, designation, unit, unit_price_cents, vat_rate_bp, use_count")
      .order("use_count", { ascending: false })
      .order("designation"),
  ]);
  const chargesVat = company?.vat_regime === "subject";
  const list = items ?? [];

  return (
    <div className="space-y-8">
      <details className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6" open={list.length === 0}>
        <summary className="cursor-pointer text-lg font-bold text-stone-900">+ Ajouter une ligne</summary>
        <div className="mt-4">
          <PriceItemForm chargesVat={chargesVat} />
        </div>
      </details>

      {list.length === 0 ? (
        <p className="rounded-3xl border-2 border-dashed border-stone-200 p-5 text-base text-stone-500">
          Rien pour l&apos;instant : vos lignes s&apos;ajouteront toutes seules quand vous enverrez vos premiers devis.
        </p>
      ) : (
        QUOTE_LINE_CATEGORIES.map((category) => {
          const inCategory = list.filter((item) => item.category === category);
          if (inCategory.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="mb-3 text-lg font-bold text-stone-900">
                {CATEGORY_LABELS[category]} <span className="font-normal text-stone-500">({inCategory.length})</span>
              </h2>
              <ul className="space-y-2">
                {inCategory.map((item) => (
                  <PriceItemRow key={item.id} item={item} chargesVat={chargesVat} summary={summaryOf(item, chargesVat)} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
