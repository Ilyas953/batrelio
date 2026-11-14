// Security hardening: browser headers, attempt limits, number and AI spending caps.
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { admin, IDENTITY, PUBLISHABLE_KEY, SUPABASE_URL } from "./helpers.mjs";

const TOO_MANY = "Trop de tentatives";

export async function securitySuite({ check, makeUser, get, action, fakeIp, bucketKey, fillBucket }) {
  const { headers } = await get("/connexion");
  const csp = headers.get("content-security-policy") ?? "";
  check("CSP : le site ne peut pas être affiché dans un autre site", csp.includes("frame-ancestors 'none'") && headers.get("x-frame-options") === "DENY");
  check("CSP : les photos Supabase restent autorisées", csp.includes(new URL(SUPABASE_URL).origin));
  check("en-têtes nosniff, HSTS et Referrer-Policy", headers.get("x-content-type-options") === "nosniff" && Boolean(headers.get("strict-transport-security")) && headers.get("referrer-policy") === "strict-origin-when-cross-origin");

  const publicClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  const key = bucketKey("e2e", randomBytes(8).toString("hex"));
  const hits = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    hits.push((await admin.rpc("consume_rate_limit", { p_key: key, p_limit: 3, p_window_seconds: 60 })).data);
  }
  check("limiteur : 3 essais puis refus", JSON.stringify(hits) === "[true,true,true,false]", JSON.stringify(hits));
  const { error: rpcError } = await publicClient.rpc("consume_rate_limit", { p_key: "x", p_limit: 1, p_window_seconds: 1 });
  const { data: rows } = await publicClient.from("rate_limit_buckets").select("key");
  check("compteurs inaccessibles avec la clé publique", Boolean(rpcError) && (!rows || rows.length === 0));

  const email = `nobody-${randomBytes(4).toString("hex")}@example.com`;
  bucketKey("signInPerEmail", email);
  const signIn = (ip, account = email) => {
    bucketKey("signInPerIp", ip);
    return action("signIn", "/connexion", { ip, args: [{}], formData: { email: account, password: "mauvais-mot-de-passe" } });
  };
  let result;
  for (let attempt = 0; attempt < 8; attempt++) result = await signIn(fakeIp());
  check("connexion : 8 essais sur un compte, mot de passe refusé normalement", result.text.includes("E-mail ou mot de passe incorrect"));
  result = await signIn(fakeIp());
  check("connexion : 9e essai sur le même compte bloqué, même depuis une autre adresse", result.text.includes(TOO_MANY));

  const busyIp = fakeIp();
  await fillBucket("signInPerIp", busyIp, 20, 900);
  const otherEmail = `other-${randomBytes(4).toString("hex")}@example.com`;
  bucketKey("signInPerEmail", otherEmail);
  result = await action("signIn", "/connexion", { ip: busyIp, args: [{}], formData: { email: otherEmail, password: "x" } });
  check("connexion : adresse qui a fait 20 essais bloquée sur tous les comptes", result.text.includes(TOO_MANY));

  const signupIp = fakeIp();
  await fillBucket("signUpPerIp", signupIp, 20, 3600);
  const signupEmail = `signup-${randomBytes(4).toString("hex")}@example.com`;
  result = await action("signUp", "/inscription", {
    ip: signupIp,
    args: [{}],
    formData: { companyName: "Abus E2E", trade: "couvreur", mobile: "06 39 98 77 01", email: signupEmail, password: "un-long-mot-de-passe-123", acceptTerms: "on" },
  });
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  check("inscription : 21e depuis la même adresse bloquée, aucun compte créé", result.text.includes(TOO_MANY) && !users.users.some((user) => user.email === signupEmail));

  const token = randomBytes(16).toString("hex");
  const requestIp = fakeIp();
  await fillBucket("customerRequestPerIp", requestIp, 15, 3600);
  const submit = (ip) => {
    bucketKey("customerRequestPerIp", ip);
    return action("submitCustomerRequest", `/demande/${token}`, { ip, args: [token], formData: { description: "Test", phone: "0639981111" } });
  };
  result = await submit(requestIp);
  check("formulaire client : 16e envoi depuis la même adresse bloqué", result.text.includes(TOO_MANY));
  result = await submit(fakeIp());
  check("formulaire client : autre adresse, réponse normale", result.text.includes("déjà été utilisé ou a expiré"));

  // AI quota: 30 quotes in 24 hours, then a blank draft (no paid suggestion).
  const artisan = await makeUser({ test: true, companyName: "Quota E2E" });
  const companyId = artisan.company.id;
  await admin.from("companies").update(IDENTITY).eq("id", companyId);
  const requestRows = Array.from({ length: 31 }, (_, index) => ({
    company_id: companyId,
    source: "link",
    customer_phone: `+336399800${String(index).padStart(2, "0")}`,
    description: "Démoussage de la toiture, 100 m²",
  }));
  const { data: requests } = await admin.from("requests").insert(requestRows).select("id");
  await admin.from("quotes").insert(requests.slice(0, 30).map((request) => ({ company_id: companyId, request_id: request.id, total_cents: 0 })));
  const target = requests[30].id;
  result = await action("createQuoteFromRequest", `/espace/demandes/${target}`, { jar: artisan.jar, args: [target] });
  const { data: quote } = await admin.from("quotes").select("id, title, ai_notes").eq("request_id", target).maybeSingle();
  check("quota IA dépassé : le devis s'ouvre quand même", Boolean(quote) && Boolean(result.redirect?.includes(quote.id)), result.redirect ?? "");
  check("quota IA dépassé : aucune proposition payante, l'artisan est prévenu", quote?.title === null && Boolean(quote?.ai_notes?.includes("limite de propositions")));
}
