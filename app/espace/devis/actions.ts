"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";
import { listMissingQuoteDetails } from "@/lib/company/legal";
import { TRADE_LABELS } from "@/lib/company/details";
import { DEFAULT_DEPOSIT_PERCENT } from "@/lib/quotes/catalog";
import { suggestQuoteDraft, type QuoteDraft } from "@/lib/quotes/ai-draft";
import { applyPriceList, priceListForPrompt, type PriceItem } from "@/lib/quotes/price-list";
import { quoteShareText } from "@/lib/quotes/share-message";
import { chargesVat, toCompanySnapshot } from "@/lib/quotes/company-snapshot";
import { QuoteEditorInputSchema, listMissingBeforeSending, type QuoteEditorInput } from "@/lib/quotes/editor-input";
import { computeTotals, depositCents } from "@/lib/quotes/totals";
import { PHOTO_BUCKET } from "@/lib/requests/limits";
import { getSiteOrigin } from "@/lib/requests/site-origin";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHOTO_URL_LIFETIME_SECONDS = 10 * 60;
const UNIQUE_VIOLATION = "23505";
const NUMBER_ATTEMPTS = 3;

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

function joinWithEt(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}

function defaultLinesFor(draft: QuoteDraft | null, vatRateBp: number, byRef: Map<string, PriceItem>) {
  const lines = draft?.lines.length
    ? draft.lines
    : [{ category: "labor" as const, designation: "Main-d'œuvre", quantity: 1, unit: "forfait" as const, priceListRef: null }];
  return applyPriceList(lines, byRef, vatRateBp).map((line, position) => ({ ...line, position }));
}

const PRICE_ITEMS_FOR_AI = 120;

// The artisan's usual lines, most used first (RLS: their own only).
async function loadPriceItems(supabase: Supabase): Promise<PriceItem[]> {
  const { data } = await supabase
    .from("price_items")
    .select("id, category, designation, unit, unit_price_cents, vat_rate_bp")
    .order("use_count", { ascending: false })
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .limit(PRICE_ITEMS_FOR_AI);
  return data ?? [];
}

const NO_SUGGESTION_NOTES = {
  unavailable: "La proposition automatique n'a pas pu être préparée : complétez les lignes vous-même.",
  quota: "Vous avez atteint la limite de propositions automatiques pour aujourd'hui : complétez les lignes vous-même. Elle revient demain.",
};

function toAiNotes(draft: QuoteDraft | null, withinQuota: boolean, reusedLines = 0): string {
  if (!draft) return NO_SUGGESTION_NOTES[withinQuota ? "unavailable" : "quota"];
  const points = [...draft.pointsToCheck];
  if (reusedLines > 0) {
    points.unshift(`${reusedLines === 1 ? "1 ligne reprend" : `${reusedLines} lignes reprennent`} vos prix habituels : vérifiez les quantités.`);
  }
  if (draft.visitRecommended) points.unshift("Une visite semble nécessaire pour chiffrer précisément.");
  return points.join("\n").slice(0, 2000);
}

async function signedPhotoUrls(supabase: Supabase, paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_LIFETIME_SECONDS);
  return (data ?? []).flatMap((photo) => (photo.signedUrl ? [photo.signedUrl] : []));
}

// Each suggestion is paid for: past the daily quota, the artisan gets a blank draft instead.
const AI_QUOTES_PER_DAY = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

async function isWithinDailyAiQuota(supabase: Supabase): Promise<boolean> {
  // RLS: only the artisan's own quotes are counted. Every quote starts from "Faire le devis".
  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - DAY_MS).toISOString());
  if (error) return false;
  if ((count ?? 0) >= AI_QUOTES_PER_DAY) {
    console.error(`Quota de devis IA atteint (${AI_QUOTES_PER_DAY} par jour) : brouillon vide.`);
    return false;
  }
  return true;
}

async function suggestDraftFor(
  supabase: Supabase,
  company: Tables<"companies">,
  request: { description: string | null; address: string | null; photos: { storage_path: string }[] },
  priceList: string,
): Promise<QuoteDraft | null> {
  const suggestion = await suggestQuoteDraft({
    priceList,
    companyName: company.name,
    trade: company.trade ? TRADE_LABELS[company.trade] : null,
    description: request.description,
    address: request.address,
    photoUrls: await signedPhotoUrls(supabase, request.photos.map((photo) => photo.storage_path)),
  });
  if (suggestion.status !== "ok") console.error(`Proposition de devis indisponible : ${suggestion.reason}`);
  return suggestion.status === "ok" ? suggestion.draft : null;
}

// "Faire le devis": an AI-suggested draft from the request, priced by the artisan afterwards.
export async function createQuoteFromRequest(requestId: string): Promise<{ error: string }> {
  if (!UUID_PATTERN.test(requestId)) return { error: "Demande introuvable." };
  const { supabase } = await requireUser();

  // RLS: only the artisan's own request and company come back.
  const [{ data: request }, { data: company }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, company_id, customer_name, description, address, photos:request_photos(storage_path), quotes(id, status)")
      .eq("id", requestId)
      .maybeSingle(),
    supabase.from("companies").select("*").maybeSingle(),
  ]);
  if (!request || !company) return { error: "Demande introuvable." };

  // One draft per request: reopen it rather than paying for a second suggestion.
  const existingDraft = request.quotes.find((quote) => quote.status === "draft");
  if (existingDraft) redirect(`/espace/devis/${existingDraft.id}`);

  const [withinQuota, priceItems] = await Promise.all([isWithinDailyAiQuota(supabase), loadPriceItems(supabase)]);
  const { text: priceList, byRef } = priceListForPrompt(priceItems);
  const draft = withinQuota ? await suggestDraftFor(supabase, company, request, priceList) : null;
  const lines = defaultLinesFor(draft, chargesVat(company) ? 2000 : 0, byRef);

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      company_id: company.id,
      request_id: request.id,
      title: draft?.title ?? null,
      customer_name: request.customer_name,
      customer_address: request.address,
      deposit_percent: DEFAULT_DEPOSIT_PERCENT,
      work_duration: draft?.estimatedDuration ?? null,
      waste_management: draft?.wasteManagement ?? null,
      ai_notes: toAiNotes(draft, withinQuota, lines.filter((line) => line.unit_price_cents !== null).length),
    })
    .select("id")
    .single();
  if (error) return { error: "Le devis n'a pas pu être créé. Réessayez." };

  const { error: linesError } = await supabase.rpc("replace_quote_lines", {
    p_quote_id: quote.id,
    p_lines: lines,
  });
  if (linesError) console.error("Lignes du devis non enregistrées :", linesError.message);

  redirect(`/espace/devis/${quote.id}`);
}

async function persistDraft(supabase: Supabase, quoteId: string, input: QuoteEditorInput, vatCharged: boolean) {
  const lines = input.lines.map((line) => ({ ...line, vatRateBp: vatCharged ? line.vatRateBp : 0 }));
  const totals = computeTotals(lines, vatCharged);

  // RLS: the update only reaches the artisan's own drafts.
  const { data, error } = await supabase
    .from("quotes")
    .update({
      title: input.title || null,
      customer_name: input.customerName || null,
      customer_address: input.customerAddress || null,
      subtotal_cents: totals.subtotalCents,
      vat_cents: totals.vatCents,
      total_cents: totals.totalCents,
      deposit_percent: input.depositPercent,
      deposit_cents: depositCents(totals.totalCents, input.depositPercent),
      validity_days: input.validityDays,
      work_start_date: input.workStartDate || null,
      work_duration: input.workDuration || null,
      waste_management: input.wasteManagement || null,
      notes: input.notes || null,
    })
    .eq("id", quoteId)
    .select("id");
  if (error || !data?.length) return "Ce devis ne peut plus être modifié.";

  const { error: linesError } = await supabase.rpc("replace_quote_lines", {
    p_quote_id: quoteId,
    p_lines: lines.map((line, position) => ({
      position,
      category: line.category,
      designation: line.designation,
      quantity: line.quantity,
      unit: line.unit,
      unit_price_cents: line.unitPriceCents,
      vat_rate_bp: line.vatRateBp,
    })),
  });
  return linesError ? "Les lignes n'ont pas pu être enregistrées. Réessayez." : null;
}

function readInput(raw: unknown): QuoteEditorInput | string {
  const parsed = QuoteEditorInputSchema.safeParse(raw);
  return parsed.success ? parsed.data : (parsed.error.issues[0]?.message ?? "Le devis contient une valeur invalide.");
}

export async function saveQuote(quoteId: string, raw: unknown): Promise<{ error?: string; savedAt?: string }> {
  if (!UUID_PATTERN.test(quoteId)) return { error: "Devis introuvable." };
  const input = readInput(raw);
  if (typeof input === "string") return { error: input };

  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("vat_regime").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const error = await persistDraft(supabase, quoteId, input, chargesVat(company));
  return error ? { error } : { savedAt: new Date().toISOString() };
}

// 2026-001, 2026-002… per company and per year. The unique constraint settles races.
async function nextQuoteNumber(admin: ReturnType<typeof createAdminClient>, companyId: string, attempt: number) {
  const year = new Date().getFullYear();
  const { count } = await admin
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .like("number", `${year}-%`);
  return `${year}-${String((count ?? 0) + 1 + attempt).padStart(3, "0")}`;
}

export type SentQuote = { url: string; shareText: string; customerPhone: string | null };

export async function sendQuote(quoteId: string, raw: unknown): Promise<{ error: string } | { sent: SentQuote }> {
  if (!UUID_PATTERN.test(quoteId)) return { error: "Devis introuvable." };
  const input = readInput(raw);
  if (typeof input === "string") return { error: input };

  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("*").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const missingCompany = listMissingQuoteDetails(company);
  if (missingCompany.length) return { error: `Avant d'envoyer, complétez votre entreprise : il manque ${joinWithEt(missingCompany)}.` };
  const missingQuote = listMissingBeforeSending(input);
  if (missingQuote.length) return { error: `Avant d'envoyer, il manque ${joinWithEt(missingQuote)}.` };

  const saveError = await persistDraft(supabase, quoteId, input, chargesVat(company));
  if (saveError) return { error: saveError };

  // Number, status and frozen legal details are written by the server only.
  const admin = createAdminClient();
  let sentQuote: { public_token: string; request_id: string; request: { customer_phone: string } } | null = null;
  for (let attempt = 0; attempt < NUMBER_ATTEMPTS && !sentQuote; attempt++) {
    const { data, error } = await admin
      .from("quotes")
      .update({
        number: await nextQuoteNumber(admin, company.id, attempt),
        status: "sent",
        sent_at: new Date().toISOString(),
        company_snapshot: toCompanySnapshot(company),
      })
      .eq("id", quoteId)
      .eq("company_id", company.id)
      .eq("status", "draft")
      .select("public_token, request_id, request:requests(customer_phone)")
      .maybeSingle();
    if (error && error.code !== UNIQUE_VIOLATION) return { error: "Le devis n'a pas pu être envoyé. Réessayez." };
    if (!error && !data) return { error: "Ce devis a déjà été envoyé." };
    sentQuote = data;
  }
  if (!sentQuote) return { error: "Le devis n'a pas pu être numéroté. Réessayez." };

  await admin.from("requests").update({ status: "quoted" }).eq("id", sentQuote.request_id).eq("company_id", company.id);
  // Its priced lines join "Mes prix", for the next quotes. RLS: the artisan's own quote and prices.
  const { error: rememberError } = await supabase.rpc("remember_quote_prices", { p_quote_id: quoteId });
  if (rememberError) console.error("Prix du devis non retenus :", rememberError.message);

  const url = `${await getSiteOrigin()}/devis/${sentQuote.public_token}`;
  return {
    sent: {
      url,
      customerPhone: sentQuote.request.customer_phone,
      shareText: quoteShareText(company, url),
    },
  };
}

export async function deleteQuote(quoteId: string): Promise<{ error: string }> {
  if (!UUID_PATTERN.test(quoteId)) return { error: "Devis introuvable." };
  const { supabase } = await requireUser();

  // RLS: only the artisan's own drafts can be deleted.
  const { data: quote } = await supabase.from("quotes").select("request_id").eq("id", quoteId).eq("status", "draft").maybeSingle();
  const { error } = await supabase.from("quotes").delete().eq("id", quoteId).eq("status", "draft");
  if (error || !quote) return { error: "Ce brouillon n'a pas pu être supprimé." };

  redirect(`/espace/demandes/${quote.request_id}`);
}
