// Tabs of the artisan space: Demandes, Devis, Réglages.
import { admin } from "./helpers.mjs";

// "← Le devis" renders as "← <!-- -->Le devis".
const backLink = (html, label) => new RegExp(`←\\s*(?:<!-- -->)?${label}<`).test(html);
const hrefOf = (html, text) => html.match(new RegExp(`href="([^"]*)"[^>]*>${text}<`))?.[1];

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
  const { data: draft } = await admin
    .from("quotes")
    .insert({ company_id: company.id, request_id: handled.id, total_cents: 0, title: "Réfection" })
    .select("id")
    .single();
  const quotePage = `/espace/devis/${draft.id}`;

  let page = await get("/espace", jar);
  check("onglet Demandes : actif sur l'accueil", page.status === 200 && activeTab(page.text, "Demandes"));
  check("onglet Demandes : les nouvelles demandes sont à traiter", page.text.includes("Mme Nouvelle"));
  check("onglet Demandes : les demandes traitées restent accessibles", page.text.includes("Traitées récemment") && page.text.includes("M. Traité"));
  check("onglet Demandes : plus de liste de devis", !page.text.includes("En attente de signature"));
  check(
    "onglet Demandes : les demandes à traiter passent avant les raccourcis",
    page.text.indexOf("Mme Nouvelle") < page.text.indexOf("Demander des infos à un client"),
  );

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

  // Every page has a way back, and it leads where the artisan came from.
  page = await get(quotePage, jar);
  check("devis : retour vers l'onglet Devis", backLink(page.text, "Devis"));
  check("devis : lien vers la demande du client", hrefOf(page.text, "Voir la demande du client") === `/espace/demandes/${handled.id}`);
  check("devis : compléter l'entreprise ramène au devis", page.text.includes(`/espace/entreprise?retour=${quotePage}`));

  page = await get(`/espace/entreprise?retour=${quotePage}`, jar);
  check("entreprise ouverte depuis un devis : « ← Le devis »", backLink(page.text, "Le devis"));
  check("entreprise ouverte depuis un devis : l'enregistrement y ramène", page.text.includes(`name="returnTo" value="${quotePage}"`));
  page = await get("/espace/entreprise?retour=https://evil.example", jar);
  check("retour inconnu : on revient aux Réglages", backLink(page.text, "Réglages") && !/href="[^"]*evil\.example/.test(page.text));

  page = await get(`/espace/messages?retour=${quotePage}`, jar);
  check("messages ouverts depuis un devis : « ← Le devis »", backLink(page.text, "Le devis"));
  page = await get("/espace/reponse-automatique?retour=/espace", jar);
  check("réponse automatique ouverte depuis l'accueil : « ← Demandes »", backLink(page.text, "Demandes"));

  page = await get("/espace/demarrage", jar);
  check("guide : retour vers Demandes par défaut", backLink(page.text, "Demandes") && hrefOf(page.text, "Continuer plus tard") === "/espace");
  page = await get("/espace/demarrage?retour=/espace/reglages", jar);
  check(
    "guide ouvert depuis Réglages : « Continuer plus tard » y ramène",
    backLink(page.text, "Réglages") && hrefOf(page.text, "Continuer plus tard") === "/espace/reglages",
  );
  page = await get("/espace/simulation", jar);
  check("simulateur : retour vers Réglages", backLink(page.text, "Réglages"));
  page = await get(`/espace/demandes/${handled.id}`, jar);
  check("demande : retour vers Demandes", backLink(page.text, "Demandes"));

  const real = await makeUser({ companyName: "Vrai E2E" });
  page = await get("/espace/reglages", real.jar);
  check("compte réel : pas de simulateur dans les réglages", page.status === 200 && !page.text.includes("Simulateur"));
}
