// "Mot de passe oublié": link by e-mail (never sent here: the link is generated directly), new password.
import { createClient } from "@supabase/supabase-js";
import { admin, PUBLISHABLE_KEY, SUPABASE_URL } from "./helpers.mjs";

const canSignIn = async (email, password) =>
  !(await createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: false } }).auth.signInWithPassword({ email, password })).error;

export async function passwordSuite({ check, makeUser, get, action, fakeIp, fillBucket }) {
  const login = await get("/connexion");
  check("connexion : lien « Mot de passe oublié ? »", login.text.includes('href="/mot-de-passe-oublie"'));
  const forgot = await get("/mot-de-passe-oublie");
  check("page « Mot de passe oublié » accessible sans compte", forgot.status === 200 && forgot.text.includes("Recevoir le lien"));

  let result = await action("requestPasswordReset", "/mot-de-passe-oublie", { ip: fakeIp(), args: [{}], formData: { email: "pas-une-adresse" } });
  check("adresse invalide refusée", result.text.includes("n'est pas valide"));
  const ip = fakeIp();
  await fillBucket("passwordResetPerIp", ip, 5, 3600);
  result = await action("requestPasswordReset", "/mot-de-passe-oublie", { ip, args: [{}], formData: { email: "e2e-limite@example.com" } });
  check("trop de demandes depuis la même adresse : bloqué (aucun e-mail envoyé)", result.text.includes("Trop de tentatives"));

  // The e-mail link, as Batrelio's template builds it: /auth/confirm?token_hash=…&type=recovery
  const artisan = await makeUser({ companyName: "Mot de passe E2E" });
  const { data: link } = await admin.auth.admin.generateLink({ type: "recovery", email: artisan.email });
  const confirmUrl = `/auth/confirm?token_hash=${link.properties.hashed_token}&type=recovery`;
  const jar = new Map();
  let page = await get(confirmUrl, jar);
  check(
    "lien de l'e-mail : connecté, sur « nouveau mot de passe »",
    page.status === 307 && page.headers.get("location")?.endsWith("/espace/mot-de-passe") && jar.size > 0,
    `${page.status} ${page.headers.get("location")}`,
  );
  page = await get("/espace/mot-de-passe", jar);
  check("page du nouveau mot de passe ouverte", page.status === 200 && page.text.includes("Nouveau mot de passe"));

  result = await action("updatePassword", "/espace/mot-de-passe", { jar, args: [{}], formData: { password: "court" } });
  check("mot de passe trop court refusé", result.text.includes("au moins 8"));
  const newPassword = "un-nouveau-mot-de-passe-e2e";
  result = await action("updatePassword", "/espace/mot-de-passe", { jar, args: [{}], formData: { password: newPassword } });
  check("nouveau mot de passe enregistré", result.text.includes('"saved":true'), result.text.slice(-200));
  check("connexion avec le nouveau mot de passe", await canSignIn(artisan.email, newPassword));
  check("l'ancien mot de passe ne marche plus", !(await canSignIn(artisan.email, artisan.password)));

  page = await get(confirmUrl, new Map());
  check("lien déjà utilisé : on en redemande un", page.headers.get("location")?.endsWith("/mot-de-passe-oublie?expire=1"), page.headers.get("location") ?? "");
  page = await get(`/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink`, new Map());
  check("type de lien inconnu : vers la connexion", page.headers.get("location")?.endsWith("/connexion"), page.headers.get("location") ?? "");

  page = await get("/espace/reglages", artisan.jar);
  check("réglages : « Mot de passe » pour le changer", page.text.includes('href="/espace/mot-de-passe"'));
}
