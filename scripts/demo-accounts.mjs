// Creates or removes fake artisan accounts with example requests and quotes,
// to try the admin and artisan spaces.
// Usage: npm run demo:seed / npm run demo:remove
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

// The only demo account you can sign in with: its password is printed by demo:seed.
const LOGIN_DEMO_EMAIL = "couvreur.demo@example.com";

const HOUR = 60 * 60 * 1000;

// Phone numbers come from the range ARCEP reserves for fiction (06 39 98 xx xx).
// No SIRET: a made-up but valid number could belong to a real company.
const DEMO_ACCOUNTS = [
  {
    email: "couvreur.demo@example.com",
    companyName: "Toitures Martin",
    smsSenderName: "TOITMARTIN",
    trade: "couvreur",
    region: "bretagne",
    requests: [
      {
        customerName: "Mme Le Goff",
        phone: "+33639980012",
        description:
          "Fuite au plafond de la chambre depuis la tempête de cette nuit. Quelques ardoises ont bougé, j'ai mis une bassine.",
        address: "14 rue de Brest, Quimper",
        hoursAgo: 0.4,
      },
      {
        customerName: "M. Tanguy",
        phone: "+33639980027",
        description: "Démoussage et traitement de la toiture avant l'hiver, maison de plain-pied d'environ 110 m².",
        address: "Lieu-dit Kerléan, Plougastel-Daoulas",
        hoursAgo: 3,
      },
    ],
    quotes: [
      { customerName: "M. Riou", phone: "+33639980031", totalCents: 234000, depositCents: 70000, status: "sent", hoursAgo: 50 },
      { customerName: "Mme Caradec", phone: "+33639980044", totalCents: 86000, depositCents: 26000, status: "sent", hoursAgo: 120 },
      { customerName: "M. Le Bihan", phone: "+33639980058", totalCents: 495000, depositCents: 148500, status: "signed", hoursAgo: 20, depositPaid: true },
      { customerName: "Mme Kerhervé", phone: "+33639980063", totalCents: 128000, depositCents: null, status: "signed", hoursAgo: 200 },
    ],
  },
  {
    email: "elagueur.demo@example.com",
    companyName: "Élagage du Val",
    smsSenderName: "ELAGAGEVAL",
    trade: "elagueur",
    region: "centre-val-de-loire",
    requests: [
      {
        customerName: "M. Chevallier",
        phone: "+33639980071",
        description: "Un grand chêne penche vers la maison depuis le dernier coup de vent. J'aimerais un avis rapidement.",
        address: "8 allée des Tilleuls, Amboise",
        hoursAgo: 1,
      },
    ],
    quotes: [
      { customerName: "Mme Poirier", phone: "+33639980085", totalCents: 145000, depositCents: 43500, status: "sent", hoursAgo: 30 },
      { customerName: "M. Gauthier", phone: "+33639980092", totalCents: 210000, depositCents: 63000, status: "signed", hoursAgo: 72, depositPaid: false },
    ],
  },
  {
    email: "plombier.demo@example.com",
    companyName: "Plomberie Roux",
    smsSenderName: "PLOMBROUX",
    trade: "plombier",
    region: "occitanie",
    requests: [
      {
        customerName: null,
        phone: "+33639980104",
        description: "Le chauffe-eau ne chauffe plus du tout depuis ce matin.",
        address: "Toulouse, quartier Saint-Cyprien",
        hoursAgo: 0.1,
      },
    ],
    quotes: [
      { customerName: "Mme Fabre", phone: "+33639980117", totalCents: 168000, depositCents: 50400, status: "signed", hoursAgo: 10, depositPaid: true },
    ],
  },
];

function readEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Variable manquante dans .env.local : ${name}`);
    process.exit(1);
  }
  return value;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

function generatePassword() {
  return randomBytes(12).toString("base64url");
}

async function listDemoUsers(supabase) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.filter((user) => user.app_metadata?.demo === true);
}

async function findOrCreateDemoUser(supabase, account) {
  const existingUser = (await listDemoUsers(supabase)).find((user) => user.email === account.email);
  if (existingUser) return { user: existingUser, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: generatePassword(),
    email_confirm: true,
    app_metadata: { demo: true },
  });
  if (error) throw error;
  return { user: data.user, created: true };
}

async function findOrCreateCompany(supabase, account, ownerId) {
  const { data: existing, error } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing.id;

  const { data, error: insertError } = await supabase
    .from("companies")
    .insert({
      owner_id: ownerId,
      name: account.companyName,
      sms_sender_name: account.smsSenderName,
      trade: account.trade,
      region: account.region,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return data.id;
}

async function insertRequest(supabase, companyId, request, { status, createdAt }) {
  const { data, error } = await supabase
    .from("requests")
    .insert({
      company_id: companyId,
      customer_name: request.customerName,
      customer_phone: request.phone,
      description: request.description ?? null,
      address: request.address ?? null,
      status,
      created_at: createdAt,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function seedActivity(supabase, companyId, account) {
  // Starts from a clean slate so running demo:seed twice gives the same result.
  const { error: deleteError } = await supabase.from("requests").delete().eq("company_id", companyId);
  if (deleteError) throw deleteError;

  for (const request of account.requests) {
    await insertRequest(supabase, companyId, request, {
      status: "new",
      createdAt: hoursAgo(request.hoursAgo),
    });
  }

  for (const quote of account.quotes) {
    const signed = quote.status === "signed";
    const requestId = await insertRequest(supabase, companyId, quote, {
      status: "quoted",
      createdAt: hoursAgo(quote.hoursAgo + (signed ? 72 : 24)),
    });
    const { error } = await supabase.from("quotes").insert({
      company_id: companyId,
      request_id: requestId,
      total_cents: quote.totalCents,
      deposit_cents: quote.depositCents,
      status: quote.status,
      sent_at: hoursAgo(signed ? quote.hoursAgo + 48 : quote.hoursAgo),
      signed_at: signed ? hoursAgo(quote.hoursAgo) : null,
      deposit_paid_at: quote.depositPaid ? hoursAgo(quote.hoursAgo) : null,
    });
    if (error) throw error;
  }
}

async function resetLoginPassword(supabase, userId) {
  const password = generatePassword();
  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) throw error;
  return password;
}

async function seedDemoAccounts(supabase) {
  for (const account of DEMO_ACCOUNTS) {
    const { user, created } = await findOrCreateDemoUser(supabase, account);
    const companyId = await findOrCreateCompany(supabase, account, user.id);
    await seedActivity(supabase, companyId, account);
    console.log(`${created ? "Créé" : "Mis à jour"} : ${account.companyName} (${account.email})`);

    if (account.email === LOGIN_DEMO_EMAIL) {
      const password = await resetLoginPassword(supabase, user.id);
      console.log(`\nConnexion de démo sur /connexion :\n  ${account.email}\n  ${password}\n`);
    }
  }
}

async function removeDemoAccounts(supabase) {
  const demoUsers = await listDemoUsers(supabase);
  for (const user of demoUsers) {
    // Companies, requests and quotes are deleted with their owner (on delete cascade).
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    console.log(`Supprimé : ${user.email}`);
  }
  if (demoUsers.length === 0) console.log("Aucun compte de démo à supprimer.");
}

async function main() {
  const supabase = createClient(
    readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    readEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  if (process.argv.includes("--remove")) {
    await removeDemoAccounts(supabase);
  } else {
    await seedDemoAccounts(supabase);
  }
}

main().catch((error) => {
  console.error("Échec :", error.message ?? error);
  process.exit(1);
});
