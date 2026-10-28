// Creates or removes fake artisan accounts, to try the admin space.
// Usage: npm run demo:seed / npm run demo:remove
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const DEMO_ACCOUNTS = [
  { email: "couvreur.demo@example.com", companyName: "Toitures Martin", smsSenderName: "TOITMARTIN" },
  { email: "elagueur.demo@example.com", companyName: "Élagage du Val", smsSenderName: "ELAGAGEVAL" },
  { email: "plombier.demo@example.com", companyName: "Plomberie Roux", smsSenderName: "PLOMBROUX" },
];

function readEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Variable manquante dans .env.local : ${name}`);
    process.exit(1);
  }
  return value;
}

async function listDemoUsers(supabase) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.filter((user) => user.app_metadata?.demo === true);
}

async function createDemoAccount(supabase, account) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    // Nobody signs in with these accounts.
    password: randomBytes(24).toString("base64url"),
    email_confirm: true,
    app_metadata: { demo: true },
  });
  if (error?.code === "email_exists") {
    console.log(`Déjà présent : ${account.email}`);
    return;
  }
  if (error) throw error;

  const { error: companyError } = await supabase.from("companies").insert({
    owner_id: data.user.id,
    name: account.companyName,
    sms_sender_name: account.smsSenderName,
  });
  if (companyError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw companyError;
  }
  console.log(`Créé : ${account.companyName} (${account.email})`);
}

async function removeDemoAccounts(supabase) {
  const demoUsers = await listDemoUsers(supabase);
  for (const user of demoUsers) {
    // Companies are deleted with their owner (on delete cascade).
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
    return;
  }
  for (const account of DEMO_ACCOUNTS) {
    await createDemoAccount(supabase, account);
  }
}

main().catch((error) => {
  console.error("Échec :", error.message ?? error);
  process.exit(1);
});
