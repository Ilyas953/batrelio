// Tabs of the artisan space: Demandes, Devis, Réglages.
import { admin } from "./helpers.mjs";

const activeTab = (html, label) => new RegExp(`aria-current="page"[^>]*>(?:<svg[\\s\\S]*?</svg>)?${label}<`).test(html);

export async function navigationSuite({ check, makeUser, get }) {
  const tester = await makeUser({ test: true, companyName: "Onglets E2E" });
  const { jar, company } = tester;

  // A request already quoted (with a draft) and a new one.
  const { data: requests } = await admin
    .from("requests")
    .insert([
      { company_id: company.id, source: "link", customer_phone: "+33639985501", customer_name: "Mme Nouvelle", description: "Fuite", status: "new" },
      { company_id: company.id, source: "link", customer_phone: "+33639985502", customer_name: "M. Traité", description: "Toiture", status: "quoted" },
    ])
    .select("id, customer_name");
  const handled = requests.find((request) => request.customer_name === "M. Traité");
  await admin.from("quotes").insert({ company_id: company.id, request_id: handled.id, total_cents: 0, title: "Réfection" });

  let page = await get("/espace", jar);
  check("onglet Demandes : actif sur l'accueil", page.status === 200 && activeTab(page.text, "Demandes"));
  check("onglet Demandes : les nouvelles demandes sont à traiter", page.text.includes("Mme Nouvelle"));
  check("onglet Demandes : les demandes traitées restent accessibles", page.text.includes("Traitées récemment") && page.text.includes("M. Traité"));
  check("onglet Demandes : plus de liste de devis", !page.text.includes("En attente de signature"));

  page = await get("/espace/devis", jar);
  check("onglet Devis : actif", page.status === 200 && activeTab(page.text, "Devis"));
  check("onglet Devis : les brouillons à terminer apparaissent", page.text.includes("À terminer") && page.text.includes("M. Traité"));
  check("onglet Devis : en attente et signés", page.text.includes("En attente de signature") && page.text.includes("Signés"));

  page = await get("/espace/reglages", jar);
  check("onglet Réglages : actif", page.status === 200 && activeTab(page.text, "Réglages"));
  check(
    "onglet Réglages : mise en place, entreprise, réponse automatique, messages, déconnexion",
    ["Mise en place", "Mon entreprise", "Réponse automatique", "Vos messages", "Se déconnecter"].every((label) => page.text.includes(label)),
  );
  check("onglet Réglages : simulateur pour un compte de test", page.text.includes("Simulateur"));

  for (const path of ["/espace/entreprise", "/espace/reponse-automatique", "/espace/messages", "/espace/demarrage"]) {
    page = await get(path, jar);
    check(`${path} : rattaché à l'onglet Réglages`, page.status === 200 && activeTab(page.text, "Réglages"));
  }
  page = await get(`/espace/demandes/${handled.id}`, jar);
  check("une demande ouverte reste dans l'onglet Demandes", page.status === 200 && activeTab(page.text, "Demandes"));

  const real = await makeUser({ companyName: "Vrai E2E" });
  page = await get("/espace/reglages", real.jar);
  check("compte réel : pas de simulateur dans les réglages", page.status === 200 && !page.text.includes("Simulateur"));
}
