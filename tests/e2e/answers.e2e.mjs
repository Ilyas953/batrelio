// Requests received apart from missed calls to return, classifying a request,
// and the customer's answer to a quote (online, or recorded by the artisan).
import { admin, IDENTITY } from "./helpers.mjs";

const INSURED = { insurer_name: "Assurance E2E", insurance_policy_number: "DEC-E2E", insurance_coverage_area: "France métropolitaine", mediator_name: "Médiateur E2E" };
// What the page shows: without React's text separators, nor the data it repeats in its scripts.
const strip = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replaceAll("<!-- -->", "").replaceAll("&#x27;", "'");
const line = (designation, unitPriceCents) => ({ category: "labor", designation, quantity: 1, unit: "u", unitPriceCents, vatRateBp: 0 });
const quoteInput = { title: "Toiture", customerName: "Mme Réponse", customerAddress: "1 rue du Test, Cergy", depositPercent: 30, validityDays: 30, workStartDate: "", workDuration: "1 jour", wasteManagement: "", notes: "", lines: [line("Réparation", 50_000)] };
const hoursAgo = (hours) => new Date(Date.now() - hours * 3600_000).toISOString();

export async function answersSuite({ check, makeUser, get, action, fakeIp, bucketKey }) {
  const artisan = await makeUser({ test: true, companyName: "Réponses E2E" });
  const { jar, company } = artisan;
  await admin.from("companies").update({ ...IDENTITY, ...INSURED }).eq("id", company.id);

  // --- Requests received and missed calls, apart ---
  const LANDLINE = "+33139985801";
  const MOBILE = "+33639985802";
  const { data: rows } = await admin
    .from("requests")
    .insert([
      // Every row lists the same columns: a missing one would be inserted as null, not as its default.
      { company_id: company.id, source: "link", customer_phone: "+33639985800", customer_name: "Mme Reçue", description: "Fuite au plafond", status: "new", created_at: hoursAgo(3) },
      { company_id: company.id, source: "missed_call", customer_phone: LANDLINE, customer_name: null, description: null, status: "new", created_at: hoursAgo(50) },
      { company_id: company.id, source: "missed_call", customer_phone: LANDLINE, customer_name: null, description: null, status: "new", created_at: hoursAgo(2) },
      { company_id: company.id, source: "missed_call", customer_phone: MOBILE, customer_name: null, description: null, status: "new", created_at: hoursAgo(1) },
    ])
    .select("id, customer_phone, created_at, source");
  const received = rows.find((row) => row.source === "link");
  const [landlineOld, landlineRecent] = rows.filter((row) => row.customer_phone === LANDLINE).toSorted((a, b) => a.created_at.localeCompare(b.created_at));
  const mobileCall = rows.find((row) => row.customer_phone === MOBILE);
  await admin.from("missed_calls").insert([
    { company_id: company.id, call_sid: `CA-e2e-${landlineOld.id}`, caller_phone: LANDLINE, request_id: landlineOld.id, sms_status: "skipped_not_mobile", created_at: landlineOld.created_at },
    { company_id: company.id, call_sid: `CA-e2e-${landlineRecent.id}`, caller_phone: LANDLINE, request_id: landlineRecent.id, sms_status: "skipped_not_mobile", created_at: landlineRecent.created_at },
    { company_id: company.id, call_sid: `CA-e2e-${mobileCall.id}`, caller_phone: MOBILE, request_id: mobileCall.id, sms_status: "delivered", created_at: mobileCall.created_at },
  ]);

  let page = await get("/espace", jar);
  let html = strip(page.text);
  const receivedAt = html.indexOf("Demandes reçues");
  const missedAt = html.indexOf("Appels manqués à rappeler");
  check("accueil : les demandes reçues et les appels manqués sont deux listes", receivedAt > -1 && missedAt > receivedAt);
  check("demandes reçues : seulement ce que le client a décrit", html.slice(receivedAt, missedAt).includes("Mme Reçue") && !html.slice(receivedAt, missedAt).includes("01 39 98 58 01"));
  const missedPart = html.slice(missedAt);
  check("appels manqués : une ligne par numéro, avec le nombre d'appels", (missedPart.match(/01 39 98 58 01/g) ?? []).length === 1 && missedPart.includes("2 appels"));
  check("appels manqués : ligne fixe signalée, SMS envoyé au portable", missedPart.includes("Ligne fixe") && missedPart.includes("SMS envoyé"));
  check("carte de demande : « Faire le devis » à côté de « Appeler »", html.slice(receivedAt, missedAt).includes("Faire le devis"));

  let result = await action("markMissedCallsDone", "/espace", { jar, args: [landlineRecent.id] });
  const { data: landlineRows } = await admin.from("requests").select("status").eq("company_id", company.id).eq("customer_phone", LANDLINE);
  check("« C'est fait » : tous les appels de ce numéro sont rappelés", landlineRows.every((row) => row.status === "closed"), result.text.slice(-200));
  page = await get("/espace", jar);
  check("« C'est fait » : le numéro quitte la liste", !strip(page.text).includes("01 39 98 58 01"));

  result = await action("markMissedCallsDone", "/espace", { jar, args: [received.id] });
  check("« C'est fait » refusé sur une demande décrite", result.text.includes("Appel introuvable"));

  // The customer describes their need later, from the SMS link: the request comes back.
  const { data: link } = await admin.from("request_links").insert({ company_id: company.id, customer_phone: MOBILE, request_id: mobileCall.id }).select("token").single();
  await admin.from("requests").update({ status: "closed" }).eq("id", mobileCall.id);
  const customerIp = fakeIp();
  bucketKey("customerRequestPerIp", customerIp);
  await action("submitCustomerRequest", `/demande/${link.token}`, { ip: customerIp, args: [link.token], formData: { description: "Gouttière cassée", phone: "06 39 98 58 02" } });
  const { data: described } = await admin.from("requests").select("status, submitted_at").eq("id", mobileCall.id).single();
  check("formulaire rempli après « C'est fait » : la demande revient dans les demandes reçues", described.status === "new" && described.submitted_at !== null);

  // --- Classifying a request ---
  result = await action("closeRequest", `/espace/demandes/${received.id}`, { jar, args: [received.id] });
  let status = (await admin.from("requests").select("status").eq("id", received.id).single()).data.status;
  check("« Classer cette demande » : elle quitte les demandes reçues", status === "closed", result.text.slice(-200));
  page = await get(`/espace/demandes/${received.id}`, jar);
  check("demande classée : « Remettre dans les demandes » proposé", page.text.includes("Remettre dans les demandes"));
  await action("reopenRequest", `/espace/demandes/${received.id}`, { jar, args: [received.id] });
  status = (await admin.from("requests").select("status").eq("id", received.id).single()).data.status;
  check("« Remettre dans les demandes » : elle revient", status === "new");

  const intruder = await makeUser({ test: true, companyName: "Intrus E2E" });
  result = await action("closeRequest", `/espace/demandes/${received.id}`, { jar: intruder.jar, args: [received.id] });
  check("un autre artisan ne peut pas classer la demande", result.text.includes("Demande introuvable"));

  // --- The customer accepts the quote online ---
  const sendQuoteFor = async (requestId) => {
    const { data: draft } = await admin.from("quotes").insert({ company_id: company.id, request_id: requestId, total_cents: 0 }).select("id").single();
    await action("sendQuote", `/espace/devis/${draft.id}`, { jar, args: [draft.id, quoteInput] });
    return (await admin.from("quotes").select("id, public_token, status").eq("id", draft.id).single()).data;
  };
  const quote = await sendQuoteFor(received.id);
  page = await get(`/devis/${quote.public_token}`);
  check("page client : « J'accepte le devis » en un geste", quote.status === "sent" && page.text.includes("Accepter le devis") && page.text.includes("accepte le devis"));

  const answerIp = fakeIp();
  bucketKey("quoteAnswerPerIp", answerIp);
  const accept = (token, formData) => action("acceptQuote", `/devis/${token}`, { ip: answerIp, args: [token], formData });
  result = await accept(quote.public_token, { name: "Marie Réponse" });
  check("acceptation refusée sans « bon pour accord » coché", result.text.includes("bon pour accord") && (await admin.from("quotes").select("status").eq("id", quote.id).single()).data.status === "sent");

  result = await accept(quote.public_token, { name: "Marie Réponse", agreed: "on" });
  const signed = (await admin.from("quotes").select("status, signed_at, signed_by_name, signed_ip").eq("id", quote.id).single()).data;
  check(
    "acceptation en ligne : nom, date et adresse gardés comme preuve",
    signed.status === "signed" && signed.signed_by_name === "Marie Réponse" && signed.signed_ip === answerIp && signed.signed_at !== null,
    result.text.slice(-200),
  );
  result = await accept(quote.public_token, { name: "Quelqu'un d'autre", agreed: "on" });
  check("devis déjà accepté : une seconde acceptation ne change rien", result.text.includes("déjà été accepté") && (await admin.from("quotes").select("signed_by_name").eq("id", quote.id).single()).data.signed_by_name === "Marie Réponse");
  page = await get(`/devis/${quote.public_token}`);
  check("page client : acceptation affichée sur le devis", strip(page.text).includes("Devis accepté en ligne par Marie Réponse"));

  result = await action("recordQuoteAnswer", `/espace/devis/${quote.id}`, { jar, args: [quote.id, "sent"] });
  check("une acceptation en ligne ne peut pas être annulée par l'artisan", result.text.includes("accepté ce devis en ligne") && (await admin.from("quotes").select("status").eq("id", quote.id).single()).data.status === "signed");
  page = await get(`/espace/devis/${quote.id}`, jar);
  check("espace artisan : « Accepté en ligne par… »", strip(page.text).includes("Accepté en ligne par Marie Réponse"));

  // --- Answer given by phone, recorded by the artisan ---
  const { data: otherRequest } = await admin
    .from("requests")
    .insert({ company_id: company.id, source: "link", customer_phone: "+33639985803", customer_name: "M. Téléphone", description: "Élagage", status: "new" })
    .select("id")
    .single();
  const phoneQuote = await sendQuoteFor(otherRequest.id);
  result = await action("recordQuoteAnswer", `/espace/devis/${phoneQuote.id}`, { jar: intruder.jar, args: [phoneQuote.id, "declined"] });
  check("un autre artisan ne peut pas répondre à ce devis", result.text.includes("Devis introuvable"));
  await action("recordQuoteAnswer", `/espace/devis/${phoneQuote.id}`, { jar, args: [phoneQuote.id, "declined"] });
  let answered = (await admin.from("quotes").select("status, declined_at").eq("id", phoneQuote.id).single()).data;
  check("« Il a refusé » : devis refusé, avec sa date", answered.status === "declined" && answered.declined_at !== null);
  page = await get(`/devis/${phoneQuote.public_token}`);
  check("page client : un devis refusé ne s'accepte plus", page.text.includes("a été refusé") && !page.text.includes("J&#x27;accepte le devis") && !page.text.includes("J'accepte le devis"));
  await action("recordQuoteAnswer", `/espace/devis/${phoneQuote.id}`, { jar, args: [phoneQuote.id, "sent"] });
  await action("recordQuoteAnswer", `/espace/devis/${phoneQuote.id}`, { jar, args: [phoneQuote.id, "signed"] });
  answered = (await admin.from("quotes").select("status, signed_at, signed_ip, declined_at").eq("id", phoneQuote.id).single()).data;
  check("annuler puis « Il a accepté » : devis signé, noté par l'artisan", answered.status === "signed" && answered.signed_at !== null && answered.signed_ip === null && answered.declined_at === null);

  // --- Validity ---
  const { data: lateRequest } = await admin
    .from("requests")
    .insert({ company_id: company.id, source: "link", customer_phone: "+33639985804", customer_name: "Mme Tardive", description: "Clôture", status: "new" })
    .select("id")
    .single();
  const lateQuote = await sendQuoteFor(lateRequest.id);
  await admin.from("quotes").update({ sent_at: hoursAgo(31 * 24) }).eq("id", lateQuote.id);
  result = await accept(lateQuote.public_token, { name: "Mme Tardive", agreed: "on" });
  check("devis expiré : l'acceptation est refusée", result.text.includes("a expiré") && (await admin.from("quotes").select("status").eq("id", lateQuote.id).single()).data.status === "sent");
}
