// Shared tools for the end-to-end suites: throwaway accounts, signed-in cookies, Server Action calls.
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// Everything a suite creates is recorded here and removed at the end, even after a failure.
export function createContext(base, actionIds) {
  const results = [];
  const userIds = [];
  const bucketKeys = [];

  const check = (label, ok, detail = "") => {
    results.push({ label, ok });
    console.log(`  ${ok ? "✓" : "✗"} ${label}${!ok && detail ? `  → ${detail}` : ""}`);
  };

  async function makeUser({ test = false, isAdmin = false, companyName = "Entreprise E2E" } = {}) {
    const email = `e2e-${randomBytes(4).toString("hex")}@example.com`;
    const password = randomBytes(18).toString("base64url");
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { ...(test ? { test_account: true } : {}), ...(isAdmin ? { role: "admin" } : {}) },
      user_metadata: { company_name: companyName, sms_sender_name: "E2ETEST", trade: "couvreur", terms_version: "e2e" },
    });
    if (error) throw error;
    userIds.push(data.user.id);
    const company = (await admin.from("companies").select("*").eq("owner_id", data.user.id).single()).data;
    return { id: data.user.id, email, password, company, jar: await signIn(email, password) };
  }

  async function signIn(email, password) {
    const jar = new Map();
    const supabase = createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => cookies.forEach((cookie) => jar.set(cookie.name, cookie.value)),
      },
    });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return jar;
  }

  const cookieHeader = (jar) => (jar ? [...jar].map(([name, value]) => `${name}=${value}`).join("; ") : "");

  // Keeps the jar in step with the session cookies the server sets (sign-in, account switch).
  function absorbCookies(jar, response) {
    if (!jar) return;
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const index = pair.indexOf("=");
      const value = pair.slice(index + 1);
      if (value) jar.set(pair.slice(0, index), value);
      else jar.delete(pair.slice(0, index));
    }
  }

  async function get(path, jar) {
    const response = await fetch(base + path, { headers: { cookie: cookieHeader(jar) }, redirect: "manual" });
    absorbCookies(jar, response);
    return { status: response.status, headers: response.headers, text: await response.text() };
  }

  // Calls a Server Action the way the browser does. args: plain values; formData: fields of the FormData argument.
  async function action(name, path, { jar, ip, args = [], formData } = {}) {
    const id = actionIds[name];
    if (!id) throw new Error(`Server Action introuvable dans le build : ${name}`);
    const headers = { "Next-Action": id, Accept: "text/x-component", Origin: base, cookie: cookieHeader(jar) };
    if (ip) headers["x-real-ip"] = ip;

    let body;
    if (formData) {
      const index = args.length;
      body = new FormData();
      for (const [key, value] of Object.entries(formData)) body.append(`_${index}_${key}`, value);
      body.append("0", JSON.stringify([...args, `$K${index}`]));
    } else {
      headers["Content-Type"] = "text/plain;charset=UTF-8";
      body = JSON.stringify(args);
    }

    const response = await fetch(base + path, { method: "POST", headers, body, redirect: "manual" });
    absorbCookies(jar, response);
    return {
      status: response.status,
      redirect: response.headers.get("x-action-redirect"),
      setCookies: response.headers.getSetCookie(),
      text: await response.text(),
    };
  }

  // A documentation address (TEST-NET-3), so counters never collide with real visitors.
  const fakeIp = () => `203.0.113.${1 + Math.floor(Math.random() * 254)}`;

  function bucketKey(scope, identifier) {
    const key = `${scope}:${createHash("sha256").update(identifier).digest("hex")}`;
    bucketKeys.push(key);
    return key;
  }

  async function fillBucket(scope, identifier, limit, windowSeconds) {
    const key = bucketKey(scope, identifier);
    for (let hit = 0; hit < limit; hit++) {
      await admin.rpc("consume_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    }
  }

  // Who the cookies belong to, e.g. after the server switched accounts. The user is then cleaned up too.
  async function trackSignedInUser(jar) {
    const supabase = createServerClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: () => {} },
    });
    const { data } = await supabase.auth.getUser();
    if (data.user) userIds.push(data.user.id);
    return data.user;
  }

  // Only removes what this run created.
  // Recorded greetings are files: deleting the account does not remove them. Recording runs in the
  // background after an answer, so let it finish (it removes its file once the company is gone).
  const BACKGROUND_WORK_MS = 3000;

  async function removeGreetingAudio(companyId) {
    const { data: files } = await admin.storage.from("greeting-audio").list(companyId, { limit: 100 });
    if (files?.length) await admin.storage.from("greeting-audio").remove(files.map((file) => `${companyId}/${file.name}`));
  }

  async function cleanup() {
    const { data: companies } = userIds.length
      ? await admin.from("companies").select("id").in("owner_id", userIds)
      : { data: [] };
    for (const id of userIds) await admin.auth.admin.deleteUser(id).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, BACKGROUND_WORK_MS));
    for (const company of companies ?? []) await removeGreetingAudio(company.id).catch(() => {});
    if (bucketKeys.length > 0) await admin.from("rate_limit_buckets").delete().in("key", bucketKeys);
  }

  return { base, check, results, makeUser, get, action, fakeIp, bucketKey, fillBucket, trackSignedInUser, cleanup };
}

export const IDENTITY = {
  siret: "13212220100016",
  legal_name: "Entreprise E2E",
  legal_form: "ei",
  address_line: "1 rue du Test",
  postal_code: "95310",
  city: "Saint-Ouen-l'Aumône",
  vat_regime: "franchise",
};
