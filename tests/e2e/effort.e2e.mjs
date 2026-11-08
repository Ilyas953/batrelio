// Less effort for the artisan: back to the right page after signing in, mobile asked at sign-up,
// listening to the greeting in the page, one-tap test call, home-screen icon.

export async function effortSuite({ check, makeUser, get, action, fakeIp }) {
  const requestPage = "/espace/demandes/0b6f1c2e-6a4f-4d3b-9c1e-2f3a4b5c6d7e";

  // Signed out, the link of a new-request SMS leads to sign-in, then back to the request.
  const signedOut = await get(requestPage);
  const location = signedOut.headers.get("location") ?? "";
  check(
    "lien du SMS sans être connecté : connexion, en retenant la demande",
    signedOut.status === 307 && location.includes(`/connexion?suite=${encodeURIComponent(requestPage)}`),
    `${signedOut.status} ${location}`,
  );

  const artisan = await makeUser({ companyName: "Effort E2E" });
  const signIn = (suite) =>
    action("signIn", "/connexion", { ip: fakeIp(), args: [{}], formData: { email: artisan.email, password: artisan.password, suite } });
  let result = await signIn(requestPage);
  check("après connexion : retour sur la demande", result.redirect?.split(";")[0] === requestPage, result.redirect ?? "aucune redirection");
  result = await signIn("https://evil.example/espace");
  // The header reads "/espace;push": the path, then how the browser should navigate.
  check("après connexion : jamais vers un autre site", result.redirect?.split(";")[0] === "/espace", result.redirect ?? "aucune redirection");

  // Sign-up asks for the mobile that receives the new-request SMS.
  result = await action("signUp", "/inscription", {
    ip: fakeIp(),
    args: [{}],
    formData: { companyName: "Sans portable E2E", trade: "couvreur", mobile: "01 45 67 89 01", email: "e2e-sans-portable@example.com", password: "un-long-mot-de-passe-123", acceptTerms: "on" },
  });
  check("inscription : un portable (06 ou 07) est demandé", result.text.includes("numéro de portable (06 ou 07)"));
  const signup = await get("/inscription");
  check("inscription : le champ portable explique à quoi il sert", signup.text.includes("Votre portable") && signup.text.includes("chaque nouveau client"));

  // Listening to the greeting in the page.
  const messages = await get("/espace/messages", artisan.jar);
  check(
    "messages : un bouton « Écouter » par voix et pour le message",
    messages.text.includes("Écouter mon message") && messages.text.includes("Écouter la voix Mathieu") && messages.text.includes("Voix IA"),
  );
  result = await action("listenToGreeting", "/espace/messages", { jar: artisan.jar, args: ["classic", ""] });
  const hasKey = Boolean(process.env.GOOGLE_TTS_API_KEY);
  check(
    hasKey ? "écoute : l'audio du message arrive" : "écoute : sans clé Google, message clair et pas d'erreur",
    hasKey ? result.text.includes("mp3Base64") : result.text.includes("pas disponible"),
    result.text.slice(-200),
  );
  result = await action("listenToGreeting", "/espace/messages", { jar: artisan.jar, args: ["voix-inconnue", ""] });
  check("écoute : voix inconnue refusée", result.text.includes("Choisissez une voix"));

  // One-tap test call: never from a test account (fictional number), only with a number.
  result = await action("startTestCall", "/espace/demarrage", { jar: artisan.jar, args: ["06 39 98 66 01"] });
  check("essai automatique : impossible sans numéro Batrelio", result.text.includes("Activez d'abord votre numéro"));
  const tester = await makeUser({ test: true, companyName: "Essai E2E" });
  result = await action("startTestCall", "/espace/demarrage", { jar: tester.jar, args: ["06 39 98 66 02"] });
  check("essai automatique : compte de test renvoyé vers le simulateur", result.text.includes("simulateur"));

  // Home-screen icon.
  const manifest = await get("/manifest.webmanifest");
  check("écran d'accueil : manifeste qui ouvre les demandes", manifest.status === 200 && manifest.text.includes('"start_url":"/espace"'));
  const icon = await get("/icon/192");
  const appleIcon = await get("/apple-icon");
  check(
    "écran d'accueil : icônes Android et iPhone",
    icon.status === 200 && icon.headers.get("content-type")?.includes("image/png") && appleIcon.status === 200,
  );
  const home = await get("/espace", artisan.jar);
  check("écran d'accueil : la page déclare l'icône iPhone et le manifeste", home.text.includes('rel="manifest"') && home.text.includes("apple-touch-icon"));
}
