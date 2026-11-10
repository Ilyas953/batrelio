// "Mes prix": lines of sent quotes are remembered per artisan, reused, editable, private.
import { createServerClient } from "@supabase/ssr";
import { admin, IDENTITY, PUBLISHABLE_KEY, SUPABASE_URL } from "./helpers.mjs";

const INSURED = {
  insurer_name: "Assurance E2E",
  insurance_policy_number: "DEC-E2E",
  insurance_coverage_area: "France métropolitaine",
  mediator_name: "Médiateur E2E",
};

function clientFor(jar) {
  return createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: () => {} },
  });
}

const line = (designation, unitPriceCents, unit = "jour", category = "equipment") => ({ category, designation, quantity: 1, unit, unitPriceCents, vatRateBp: 0 });

function quoteInput(lines) {
  return { title: "Élagage", customerName: "Mme Prix", customerAddress: "1 rue du Test, Cergy", depositPercent: 30, validityDays: 30, workStartDate: "", workDuration: "1 jour", wasteManagement: "", notes: "", lines };
}

export async function pricesSuite({ check, makeUser, get, action }) {
  const artisan = await makeUser({ test: true, companyName: "Prix E2E" });
  const company = artisan.company;
  await admin.from("companies").update({ ...IDENTITY, ...INSURED }).eq("id", company.id);

  async function sendQuoteWith(lines) {
    const { data: request } = await admin
      .from("requests")
      .insert({ company_id: company.id, source: "link", customer_phone: "+33639985541", customer_name: "Mme Prix", description: "Élagage", status: "new" })
      .select("id")
      .single();
    const { data: quote } = await admin.from("quotes").insert({ company_id: company.id, request_id: request.id, total_cents: 0 }).select("id").single();
    const result = await action("sendQuote", `/espace/devis/${quote.id}`, { jar: artisan.jar, args: [quote.id, quoteInput(lines)] });
    return { quoteId: quote.id, result };
  }
  const readItems = async () =>
    (await admin.from("price_items").select("designation, unit, unit_price_cents, use_count").eq("company_id", company.id).order("designation")).data ?? [];

  // The same line twice in a quote (other capitals, spaces) is remembered once.
  const first = await sendQuoteWith([line("Location  nacelle 12 m", 25_000), line("location NACELLE 12 m", 25_000), line("Élagage chêne", 45_000, "u", "labor")]);
  check("devis envoyé", first.result.text.includes('"sent"'), first.result.text.slice(-300));
  let items = await readItems();
  check(
    "devis envoyé : ses lignes chiffrées rejoignent « Mes prix », sans doublon, telles que tapées la première fois (espaces nettoyés)",
    items.length === 2 && items.some((item) => item.designation === "Location nacelle 12 m" && item.unit_price_cents === 25_000 && item.use_count === 1),
    JSON.stringify(items),
  );

  await sendQuoteWith([line("Location nacelle 12 m", 28_000)]);
  items = await readItems();
  const nacelle = items.find((item) => item.unit === "jour");
  check("prix mis à jour avec le dernier utilisé, et compté", nacelle?.unit_price_cents === 28_000 && nacelle.use_count === 2, JSON.stringify(nacelle));

  let page = await get("/espace/prix", artisan.jar);
  check("page « Mes prix » : les lignes, leur prix et leur usage", page.status === 200 && page.text.includes("Location nacelle 12 m") && page.text.includes("Matériel et outils") && page.text.includes("utilisée 2 fois"));

  let result = await action("savePriceItem", "/espace/prix", { jar: artisan.jar, args: [null, {}], formData: { designation: "Location broyeur", category: "equipment", unit: "jour", price: "180" } });
  check("ajout d'une ligne à la main", result.text.includes('"saved":true') && (await readItems()).some((item) => item.designation === "Location broyeur"));
  result = await action("savePriceItem", "/espace/prix", { jar: artisan.jar, args: [null, {}], formData: { designation: "location broyeur", category: "equipment", unit: "jour", price: "200" } });
  check("même ligne deux fois : refusée avec une explication", result.text.includes("déjà dans vos prix"));

  // Reused while typing: the editor of a new quote receives the list.
  const { data: request } = await admin.from("requests").insert({ company_id: company.id, source: "link", customer_phone: "+33639985542", description: "x", status: "new" }).select("id").single();
  const { data: draft } = await admin.from("quotes").insert({ company_id: company.id, request_id: request.id, total_cents: 0 }).select("id").single();
  page = await get(`/espace/devis/${draft.id}`, artisan.jar);
  check("éditeur de devis : les lignes habituelles sont proposées", page.text.includes("Location broyeur"));

  // Private to each artisan.
  const other = await makeUser({ test: true, companyName: "Voisin Prix E2E" });
  const seen = await clientFor(other.jar).from("price_items").select("id").eq("company_id", company.id);
  check("RLS : un autre artisan ne voit pas ces prix", seen.data?.length === 0);
  await clientFor(other.jar).rpc("remember_quote_prices", { p_quote_id: first.quoteId });
  const { count: copied } = await admin.from("price_items").select("id", { count: "exact", head: true }).eq("company_id", other.company.id);
  check("RLS : impossible de récupérer les prix d'un devis d'un autre", copied === 0);
  const { data: target } = await admin.from("price_items").select("id").eq("company_id", company.id).eq("designation", "Location broyeur").single();
  await action("deletePriceItem", "/espace/prix", { jar: other.jar, args: [target.id] });
  check("RLS : impossible de supprimer les prix d'un autre", (await readItems()).some((item) => item.designation === "Location broyeur"));

  result = await action("deletePriceItem", "/espace/prix", { jar: artisan.jar, args: [target.id] });
  check("suppression d'une ligne par son artisan", !(await readItems()).some((item) => item.designation === "Location broyeur"));
}
