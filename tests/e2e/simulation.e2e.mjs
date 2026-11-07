// Test account, fictional number and missed-call simulator, through the real app and database.
import { admin, IDENTITY } from "./helpers.mjs";

const SMS_PREVIEW = "Nous n'avons pas pu décrocher";

// The SMS to the artisan leaves after the customer's answer: wait for it to be recorded.
async function waitFor(read, attempts = 20) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const value = await read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

export async function simulationSuite({ check, makeUser, get, action, fakeIp, trackSignedInUser }) {
  const tester = await makeUser({ test: true, companyName: "Couvreur E2E" });
  const { jar, company } = tester;

  let page = await get("/espace/demarrage", jar);
  check("le guide affiche le bandeau « Compte de test »", page.text.includes("Compte de test"));
  check("le guide démarre à 0 étape sur 5", page.text.includes("0<!-- --> étape"));
  check("l'étape 3 attend l'entreprise", page.text.includes("entreprise identifiée"));

  let result = await action("simulateCall", "/espace/simulation", { jar, args: [{}], formData: { caller: "06 39 98 11 11" } });
  check("pas de simulation sans numéro", result.text.includes("Activez d'abord votre numéro"));

  result = await action("activateAutoReply", "/espace/demarrage", { jar, args: ["/espace/demarrage"] });
  check("pas de numéro sans SIRET ni adresse", result.text.includes("Renseignez d'abord votre entreprise"));

  await admin.from("companies").update(IDENTITY).eq("id", company.id);
  result = await action("activateAutoReply", "/espace/demarrage", { jar, args: ["/espace/demarrage"] });
  const activated = (await admin.from("companies").select("*").eq("id", company.id).single()).data;
  check("l'activation revient au guide", result.redirect?.startsWith("/espace/demarrage"), result.redirect ?? result.text.slice(-200));
  check("numéro fictif 01 99 00, aucun achat chez Twilio", /^\+3319900\d{4}$/.test(activated.phone_number ?? "") && activated.phone_number_sid === null, activated.phone_number);
  check("réponse automatique activée", activated.auto_reply_enabled === true);

  page = await get("/espace/demarrage", jar);
  check("le guide dit de ne pas composer le code", page.text.includes("ne composez pas ce code"));

  const simulate = (formData) => action("simulateCall", "/espace/simulation", { jar, args: [{}], formData });
  result = await simulate({ caller: "06 39 98 12 34" });
  const link = result.text.match(/https?:\/\/[^"\s]+\/demande\/[0-9a-f]{32}/)?.[0];
  check("un mobile reçoit le SMS (affiché, pas envoyé)", result.text.includes(SMS_PREVIEW) && Boolean(link));
  check("le message d'accueil annonce le SMS", result.text.includes("Vous allez recevoir un SMS"));
  if (link) {
    const form = await get(new URL(link).pathname);
    check("le lien ouvre le formulaire client", form.status === 200 && !form.text.includes("déjà été utilisé"));
  }

  result = await simulate({ caller: "06 39 98 12 34" });
  check("même numéro dans les 24 h : pas de 2e SMS", result.text.includes('"status":"skipped_recent"'));
  result = await simulate({ hidden: "on" });
  check("numéro masqué : on lui demande de rappeler", result.text.includes('"status":"skipped_anonymous"') && result.text.includes("masqué"));
  result = await simulate({ caller: "01 99 00 55 55" });
  check("ligne fixe : pas de SMS", result.text.includes('"status":"skipped_not_mobile"') && !result.text.includes(SMS_PREVIEW));
  result = await simulate({ caller: "abc" });
  check("numéro invalide refusé", result.text.includes("pas valide"));

  const { data: calls } = await admin.from("missed_calls").select("sms_status, sms_sid, call_sid").eq("company_id", company.id);
  const statuses = calls.map((call) => call.sms_status).sort();
  check(
    "historique des appels complet",
    JSON.stringify(statuses) === JSON.stringify(["sent", "skipped_anonymous", "skipped_not_mobile", "skipped_recent"]),
    JSON.stringify(statuses),
  );
  check("identifiants simulés, jamais de vrai SMS", calls.every((call) => call.call_sid.startsWith("SIM-") && (!call.sms_sid || call.sms_sid.startsWith("SIM-"))));
  // A missed call alone is not a request: it only shows once the customer described their need.
  page = await get("/espace", jar);
  check("appels sans formulaire : rien dans « À traiter »", page.text.includes("Rien à traiter") && !page.text.includes("06 39 98 12 34"));
  page = await get("/espace/reponse-automatique", jar);
  check("appels sans formulaire : visibles dans l'historique", page.text.includes("06 39 98 12 34") && page.text.includes("01 99 00 55 55"));

  if (link) {
    const token = link.split("/").at(-1);
    result = await action("submitCustomerRequest", `/demande/${token}`, {
      args: [token],
      ip: fakeIp(),
      formData: { name: "Mme Formulaire", phone: "06 39 98 12 34", description: "Tuiles envolées", address: "" },
    });
    check("le client envoie le formulaire", result.text.includes('"ok":true'), result.text.slice(-200));
    page = await get("/espace", jar);
    check("demande remplie : elle arrive dans « À traiter »", page.text.includes("Mme Formulaire") && page.text.includes("Tuiles envolées"));
    const announced = await waitFor(async () => {
      const { data } = await admin.from("requests").select("artisan_sms_status, submitted_at, source").eq("company_id", company.id).eq("customer_name", "Mme Formulaire").single();
      return data?.artisan_sms_status ? data : null;
    });
    check(
      "compte de test : SMS à l'artisan prévu mais jamais envoyé",
      announced?.artisan_sms_status === "skipped_test_account" && announced.submitted_at !== null && announced.source === "missed_call",
      JSON.stringify(announced),
    );
  }

  page = await get("/espace/demarrage", jar);
  // Company, number, then forwarding and test, both proven by the first call (insurance left empty).
  check("le premier appel valide le renvoi et l'essai (4 sur 5)", page.text.includes("4<!-- --> étape"));

  // A real account never reaches the simulator.
  const real = await makeUser({ companyName: "Vrai compte E2E" });
  page = await get("/espace/simulation", real.jar);
  check("compte réel : pas de simulateur", !page.text.includes("Simuler un appel manqué") && page.text.includes("404"));
  page = await get("/espace/demarrage", real.jar);
  check("compte réel : pas de bandeau de test", !page.text.includes("Compte de test"));
  result = await action("simulateCall", "/espace/simulation", { jar: real.jar, args: [{}], formData: { caller: "06 39 98 12 35" } });
  const { count: realCalls } = await admin.from("missed_calls").select("id", { count: "exact", head: true }).eq("company_id", real.company.id);
  check("compte réel : simulation refusée", realCalls === 0 && !result.text.includes(SMS_PREVIEW));
  result = await action("restartTestAccount", "/espace/simulation", { jar: real.jar });
  const { data: stillThere } = await admin.auth.admin.getUserById(real.id);
  check("compte réel : remise à zéro refusée", Boolean(stillThere.user) && !result.redirect);

  // A real account: the SMS is only sent to a mobile number (not tested here: it would really send one).
  for (const [contactPhone, expected] of [[null, "skipped_no_phone"], ["+33199005566", "skipped_not_mobile"]]) {
    await admin.from("companies").update({ contact_phone: contactPhone }).eq("id", real.company.id);
    const { data: realLink } = await admin.from("request_links").insert({ company_id: real.company.id, customer_phone: "+33639985531" }).select("token").single();
    await action("submitCustomerRequest", `/demande/${realLink.token}`, {
      args: [realLink.token],
      ip: fakeIp(),
      formData: { name: `Client ${expected}`, phone: "06 39 98 55 31", description: "Élagage", address: "" },
    });
    const status = await waitFor(async () => {
      const { data } = await admin.from("requests").select("artisan_sms_status").eq("company_id", real.company.id).eq("customer_name", `Client ${expected}`).maybeSingle();
      return data?.artisan_sms_status ?? null;
    });
    check(`compte réel : pas de SMS sans portable (${expected})`, status === expected, String(status));
  }
  page = await get("/espace/reponse-automatique", real.jar);
  check("compte réel sans portable : invité à l'ajouter", page.text.includes("indiquez votre portable (06 ou 07)"));

  // Restart: a brand new blank test account replaces this one.
  result = await action("restartTestAccount", "/espace/simulation", { jar });
  const fresh = await trackSignedInUser(jar);
  check("« Recommencer à zéro » revient au guide", result.redirect?.startsWith("/espace/demarrage"), result.redirect ?? result.text.slice(-200));
  const { data: old } = await admin.auth.admin.getUserById(tester.id);
  const { count: oldCompany } = await admin.from("companies").select("id", { count: "exact", head: true }).eq("id", company.id);
  check("l'ancien compte et ses données sont supprimés", !old.user && oldCompany === 0);
  check("le nouveau compte est un compte de test vierge", fresh?.app_metadata?.test_account === true && fresh.id !== tester.id);
  page = await get("/espace/demarrage", jar);
  check("le nouveau compte repart de 0 sur 5", page.text.includes("Compte de test") && page.text.includes("0<!-- --> étape"));
}
