// Company logo: uploaded in Mon entreprise, shown on quotes and invoices, private.
import { createServerClient } from "@supabase/ssr";
import { admin, IDENTITY, PUBLISHABLE_KEY, SUPABASE_URL } from "./helpers.mjs";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const INSURED = { insurer_name: "Assurance E2E", insurance_policy_number: "DEC-E2E", insurance_coverage_area: "France métropolitaine", mediator_name: "Médiateur E2E" };
const quoteInput = { title: "Logo", customerName: "Mme Logo", customerAddress: "1 rue du Test", depositPercent: 0, validityDays: 30, workStartDate: "", workDuration: "1 jour", wasteManagement: "", notes: "",
  lines: [{ category: "labor", designation: "Pose", quantity: 1, unit: "u", unitPriceCents: 10_000, vatRateBp: 0 }] };

export async function logoSuite({ check, makeUser, get, action }) {
  const artisan = await makeUser({ test: true, companyName: "Logo E2E" });
  const company = artisan.company;
  await admin.from("companies").update({ ...IDENTITY, ...INSURED }).eq("id", company.id);
  const logoPath = async () => (await admin.from("companies").select("logo_path").eq("id", company.id).single()).data.logo_path;

  let page = await get("/espace/entreprise", artisan.jar);
  check("Mon entreprise : choisir son logo", page.text.includes("Votre logo") && page.text.includes("Choisir mon logo"));

  let result = await action("uploadLogo", "/espace/entreprise", { jar: artisan.jar, args: [{}], formData: { logo: new File([new TextEncoder().encode("<svg onload=alert(1)>")], "logo.svg", { type: "image/svg+xml" }) } });
  check("un SVG (ou un faux PNG) est refusé", result.text.includes("PNG, JPEG ou WebP") && (await logoPath()) === null);
  result = await action("uploadLogo", "/espace/entreprise", { jar: artisan.jar, args: [{}], formData: { logo: new File([PNG], "logo.png", { type: "image/png" }) } });
  const path = await logoPath();
  check("logo PNG enregistré dans le dossier de l'entreprise", result.text.includes('"saved":true') && path?.startsWith(`${company.id}/`), String(path));

  // On the quote the customer receives.
  const { data: request } = await admin.from("requests").insert({ company_id: company.id, source: "link", customer_phone: "+33639985571", customer_name: "Mme Logo", description: "x", status: "new" }).select("id").single();
  const { data: quote } = await admin.from("quotes").insert({ company_id: company.id, request_id: request.id, total_cents: 0 }).select("id").single();
  await action("sendQuote", `/espace/devis/${quote.id}`, { jar: artisan.jar, args: [quote.id, quoteInput] });
  const { data: sent } = await admin.from("quotes").select("public_token, company_snapshot").eq("id", quote.id).single();
  page = await get(`/devis/${sent.public_token}`);
  check("devis du client : le logo en haut", sent.company_snapshot?.logo_path === path && page.text.includes("company-logos") && page.text.includes('alt="Logo Logo E2E"'));

  // A new logo does not change the quote already sent.
  await action("uploadLogo", "/espace/entreprise", { jar: artisan.jar, args: [{}], formData: { logo: new File([PNG], "nouveau.png", { type: "image/png" }) } });
  const { data: after } = await admin.from("quotes").select("company_snapshot").eq("id", quote.id).single();
  check("nouveau logo : le devis déjà envoyé garde le sien", after.company_snapshot?.logo_path === path && (await logoPath()) !== path);

  // Private: read only through the server's short-lived link.
  const asArtisan = createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, { cookies: { getAll: () => [...artisan.jar].map(([name, value]) => ({ name, value })), setAll: () => {} } });
  check("logo jamais lisible directement", (await asArtisan.storage.from("company-logos").download(path)).error !== null);
  const directWrite = await asArtisan.from("companies").update({ logo_path: `${company.id}/00000000-0000-0000-0000-000000000000.png` }).eq("id", company.id).select("id");
  check("l'artisan ne peut pas choisir lui-même le fichier du logo", directWrite.error !== null || (directWrite.data ?? []).length === 0);

  result = await action("removeLogo", "/espace/entreprise", { jar: artisan.jar, args: [] });
  check("retirer le logo", (await logoPath()) === null);
}
