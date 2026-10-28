// Creates an admin account, or grants the admin role to an existing account.
// Usage: npm run admin:create
import { createClient } from "@supabase/supabase-js";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const MIN_PASSWORD_LENGTH = 8;

function readEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Variable manquante dans .env.local : ${name}`);
    process.exit(1);
  }
  return value;
}

async function askVisible(question) {
  const readline = createInterface({ input: stdin, output: stdout });
  const answer = await readline.question(question);
  readline.close();
  return answer.trim();
}

function askHidden(question) {
  return new Promise((resolve) => {
    let value = "";
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();

    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") process.exit(1);
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        value = char === "\u007f" ? value.slice(0, -1) : value + char;
      }
    };
    stdin.on("data", onData);
  });
}

async function findUserByEmail(supabase, email) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => user.email === email) ?? null;
}

async function grantAdminRole(supabase, user) {
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: "admin" },
  });
  if (error) throw error;
}

async function main() {
  const supabase = createClient(
    readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    readEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const email = (await askVisible("E-mail de l'admin : ")).toLowerCase();
  const existingUser = await findUserByEmail(supabase, email);

  if (existingUser) {
    await grantAdminRole(supabase, existingUser);
    console.log(`${email} est maintenant admin.`);
    return;
  }

  const password = await askHidden("Mot de passe (masqué) : ");
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
    process.exit(1);
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  if (error) throw error;
  console.log(`Compte admin créé pour ${email}. Connexion sur /connexion.`);
}

main().catch((error) => {
  console.error("Échec :", error.message ?? error);
  process.exit(1);
});
