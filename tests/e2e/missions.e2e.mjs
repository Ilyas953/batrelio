// Answers to a request besides the quote: propose a visit, share the mission with Batrelio.
import { createServerClient } from "@supabase/ssr";
import { admin, PUBLISHABLE_KEY, SUPABASE_URL } from "./helpers.mjs";

// The artisan's own database client, as the browser would have it (publishable key + session).
function clientFor(jar) {
  return createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: () => {} },
  });
}

// "2026-11-12" a week from now, in Paris time.
function dateInDays(days) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() + days * 86400000));
}

export async function missionsSuite({ check, makeUser, get, action }) {
  const artisan = await makeUser({ test: true, companyName: "Visites E2E" });
  const other = await makeUser({ test: true, companyName: "Voisin E2E" });
  const { data: request } = await admin
    .from("requests")
    .insert({ company_id: artisan.company.id, source: "link", customer_phone: "+33639985521", customer_name: "Mme Visite", description: "Haie de 30 m à tailler", status: "new" })
    .select("id")
    .single();
  const page = `/espace/demandes/${request.id}`;
  const readRequest = async () => (await admin.from("requests").select("status, visit_at").eq("id", request.id).single()).data;
  const readMission = async () => (await admin.from("shared_missions").select("id, status, artisan_note, admin_note").eq("request_id", request.id).maybeSingle()).data;

  let html = (await get(page, artisan.jar)).text;
  check("demande : les trois réponses sont proposées", ["Faire le devis", "Proposer une visite", "Partager la mission"].every((label) => html.includes(label)));

  // Visit
  let result = await action("proposeVisit", page, { jar: artisan.jar, args: [request.id], formData: { date: dateInDays(-1), time: "10:00" } });
  check("visite : une date passée est refusée", result.text.includes("déjà passée") && (await readRequest()).visit_at === null);

  const visitDate = dateInDays(7);
  result = await action("proposeVisit", page, { jar: artisan.jar, args: [request.id], formData: { date: visitDate, time: "14:30" } });
  let stored = await readRequest();
  check(
    "visite : enregistrée et message prêt à envoyer",
    stored.status === "visit_proposed" && stored.visit_at !== null && result.text.includes("Bonjour Mme Visite, c'est Visites E2E") && result.text.includes("à 14 h 30"),
    JSON.stringify(stored),
  );
  html = (await get(page, artisan.jar)).text;
  check("visite : affichée sur la demande", html.includes("Visite proposée le") && html.includes("Renvoyer le message"));
  check("visite : visible dans les demandes traitées", (await get("/espace", artisan.jar)).text.includes("Visite proposée"));

  result = await action("proposeVisit", page, { jar: other.jar, args: [request.id], formData: { date: visitDate, time: "09:00" } });
  check("visite : impossible sur la demande d'un autre artisan", result.text.includes("Demande introuvable") && (await readRequest()).visit_at === stored.visit_at);

  // Sharing
  result = await action("shareMission", page, { jar: other.jar, args: [request.id], formData: { note: "" } });
  check("partage : impossible pour la demande d'un autre artisan", result.text.includes("Demande introuvable") && (await readMission()) === null);

  const db = clientFor(artisan.jar);
  const direct = await db.from("shared_missions").insert({ request_id: request.id, company_id: artisan.company.id });
  check("partage : écriture directe en base refusée", direct.error !== null && (await readMission()) === null);

  result = await action("shareMission", page, { jar: artisan.jar, args: [request.id], formData: { note: "Pas mon métier, client pressé" } });
  let mission = await readMission();
  check(
    "partage : la mission est transmise avec le mot de l'artisan",
    result.redirect?.includes(page) && mission?.status === "to_place" && mission.artisan_note === "Pas mon métier, client pressé" && (await readRequest()).status === "shared",
  );
  result = await action("shareMission", page, { jar: artisan.jar, args: [request.id], formData: { note: "" } });
  check("partage : une seule fois par demande", result.text.includes("déjà été partagée"));
  result = await action("proposeVisit", page, { jar: artisan.jar, args: [request.id], formData: { date: visitDate, time: "09:00" } });
  check("partage : la demande ne se modifie plus", result.text.includes("a été partagée"));

  html = (await get(page, artisan.jar)).text;
  check("partage : l'artisan voit que Batrelio cherche quelqu'un", html.includes("Mission partagée") && html.includes("Batrelio cherche un artisan") && !html.includes("Faire le devis"));
  const home = (await get("/espace", artisan.jar)).text;
  check("partage : la demande quitte « À traiter »", home.includes("Mission partagée") && home.includes("Rien à traiter"));

  const own = await db.from("shared_missions").select("status").eq("request_id", request.id);
  const secret = await db.from("shared_missions").select("admin_note").eq("request_id", request.id);
  const foreign = await clientFor(other.jar).from("shared_missions").select("id").eq("request_id", request.id);
  check("RLS : l'artisan lit le statut de sa mission", own.data?.length === 1 && own.data[0].status === "to_place");
  check("RLS : les notes internes lui restent inaccessibles", secret.error !== null);
  check("RLS : un autre artisan ne voit pas la mission", foreign.data?.length === 0);

  // Admin
  const notAdmin = await get("/admin/missions", artisan.jar);
  check("admin : un artisan ne voit pas les missions", !notAdmin.text.includes("Mme Visite"));
  const boss = await makeUser({ isAdmin: true, companyName: "Admin E2E" });
  html = (await get("/admin/missions", boss.jar)).text;
  check("admin : la mission arrive avec le client et le mot de l'artisan", html.includes("Mme Visite") && html.includes("Haie de 30 m") && html.includes("Pas mon métier") && html.includes("Visites E2E"));

  await action("updateMission", "/admin/missions", { jar: artisan.jar, args: [mission.id], formData: { status: "placed", adminNote: "piratage" } });
  check("admin : un artisan ne peut pas modifier le suivi", (await readMission()).status === "to_place");

  result = await action("updateMission", "/admin/missions", { jar: boss.jar, args: [mission.id], formData: { status: "placed", adminNote: "Confiée à Jardins Dupont" } });
  mission = await readMission();
  check("admin : suivi enregistré", mission.status === "placed" && mission.admin_note === "Confiée à Jardins Dupont");
  result = await action("updateMission", "/admin/missions", { jar: boss.jar, args: [mission.id], formData: { status: "n-importe-quoi", adminNote: "" } });
  check("admin : statut inconnu refusé", (await readMission()).status === "placed");

  html = (await get(page, artisan.jar)).text;
  check("artisan : voit que la mission est confiée, pas les notes internes", html.includes("Mission confiée") && !html.includes("Jardins Dupont"));
}
