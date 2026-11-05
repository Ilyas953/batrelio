// Personalised greeting (voice and text) and quote message.
import { admin, IDENTITY } from "./helpers.mjs";

export async function messagesSuite({ check, makeUser, get, action }) {
  const tester = await makeUser({ test: true, companyName: "Messages E2E" });
  const { jar, company } = tester;
  const read = async () => (await admin.from("companies").select("greeting_intro, greeting_voice, quote_message").eq("id", company.id).single()).data;

  let page = await get("/espace/messages", jar);
  check("la page des messages s'ouvre avec les messages par défaut", page.status === 200 && page.text.includes("Bonjour, vous êtes bien chez Messages E2E"));

  const intro = "Bonjour, c'est Pierre de Messages E2E, je suis sur un toit";
  let result = await action("saveGreeting", "/espace/messages", { jar, args: [{}], formData: { voice: "remi-ai", intro } });
  let stored = await read();
  check("voix et message enregistrés", result.text.includes('"saved":true') && stored.greeting_voice === "remi-ai" && stored.greeting_intro === intro, JSON.stringify(stored));

  result = await action("saveGreeting", "/espace/messages", { jar, args: [{}], formData: { voice: "voix-inconnue", intro } });
  check("voix inconnue refusée", result.text.includes("Choisissez une voix") && (await read()).greeting_voice === "remi-ai");
  result = await action("saveGreeting", "/espace/messages", { jar, args: [{}], formData: { voice: "classic", intro: "x".repeat(301) } });
  check("message trop long refusé", result.text.includes("trop long") && (await read()).greeting_intro === intro);

  // The simulated call reads the personalised greeting.
  await admin.from("companies").update(IDENTITY).eq("id", company.id);
  await action("activateAutoReply", "/espace/demarrage", { jar, args: ["/espace/demarrage"] });
  result = await action("simulateCall", "/espace/simulation", { jar, args: [{}], formData: { caller: "06 39 98 44 44" } });
  check("l'appel simulé commence par le message de l'artisan", result.text.includes(`${intro}. Vous allez recevoir un SMS`));

  result = await action("saveGreeting", "/espace/messages", {
    jar,
    args: [{}],
    formData: { voice: "classic", intro: "Bonjour, vous êtes bien chez Messages E2E. Nous ne pouvons pas vous répondre pour le moment." },
  });
  stored = await read();
  check("revenir au message par défaut l'efface (il suit alors le nom de l'entreprise)", stored.greeting_intro === null && stored.greeting_voice === "classic");

  result = await action("previewGreeting", "/espace/messages", { jar, args: [{}], formData: { voice: "lea-ai", intro, phone: "06 39 98 00 00" } });
  check("compte de test : pas d'appel d'écoute (numéro fictif)", result.text.includes("compte de test"));

  const real = await makeUser({ companyName: "Sans numéro E2E" });
  result = await action("previewGreeting", "/espace/messages", { jar: real.jar, args: [{}], formData: { voice: "lea-ai", intro, phone: "06 39 98 00 00" } });
  check("sans numéro activé : pas d'appel d'écoute", result.text.includes("Activez d'abord votre numéro"));

  result = await action("saveQuoteMessage", "/espace/messages", { jar, args: [{}], formData: { message: "Bonsoir, comme promis voici le devis." } });
  check("message d'envoi des devis enregistré", (await read()).quote_message === "Bonsoir, comme promis voici le devis.");
  result = await action("saveQuoteMessage", "/espace/messages", { jar, args: [{}], formData: { message: "" } });
  check("message vide : retour au message par défaut", (await read()).quote_message === null);

  // Column privileges: the artisan can never write another company's messages.
  const { data: other } = await admin.from("companies").select("quote_message").eq("id", real.company.id).single();
  check("les messages d'un autre artisan restent intacts", other.quote_message === null);
}
