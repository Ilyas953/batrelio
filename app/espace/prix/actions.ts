"use server";

import { requireUser } from "@/lib/auth/session";
import { readPriceItemInput } from "@/lib/quotes/price-item-input";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNIQUE_VIOLATION = "23505";

export type PriceItemState = { error?: string; saved?: boolean };

// Adds a line (itemId null) or changes one. RLS: only the artisan's own prices.
export async function savePriceItem(itemId: string | null, _previous: PriceItemState, formData: FormData): Promise<PriceItemState> {
  if (itemId !== null && !UUID_PATTERN.test(itemId)) return { error: "Ligne introuvable." };
  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("id, vat_regime").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const input = readPriceItemInput(formData, company.vat_regime === "subject");
  if ("error" in input) return input;

  const { error } = itemId
    ? await supabase.from("price_items").update(input).eq("id", itemId)
    : await supabase.from("price_items").insert({ ...input, company_id: company.id });
  if (error?.code === UNIQUE_VIOLATION) return { error: "Cette ligne est déjà dans vos prix, avec la même unité." };
  if (error) return { error: "La ligne n'a pas pu être enregistrée. Réessayez." };
  return { saved: true };
}

export async function deletePriceItem(itemId: string): Promise<{ error?: string }> {
  if (!UUID_PATTERN.test(itemId)) return { error: "Ligne introuvable." };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("price_items").delete().eq("id", itemId);
  return error ? { error: "La ligne n'a pas pu être supprimée. Réessayez." } : {};
}
