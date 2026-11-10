import "server-only";
import { randomBytes } from "node:crypto";
import { isTestAccount } from "@/lib/auth/session";
import { TRADE_LABELS, type Trade } from "@/lib/company/details";
import { toSmsSenderNameOrFallback } from "@/lib/company/sms-sender";
import { LEGAL_VERSION } from "@/lib/legal/publisher";
import { PHOTO_BUCKET } from "@/lib/requests/limits";
import { removeGreetingAudio } from "@/lib/telephony/greeting-audio";
import { removeCompanyLogos } from "@/lib/company/logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { randomFictionLandline } from "./fiction-numbers";

// Every function here uses the secret key: callers check first that the user is an admin,
// or a test account acting on itself.

const MAX_USERS_PER_PAGE = 1000;
const UNIQUE_VIOLATION = "23505";
const NUMBER_ATTEMPTS = 5;

type TestAccount = { email: string; password: string };

// A blank account, created like a real signup (the database trigger creates its company),
// so the setup guide starts from zero.
export async function createTestAccount(trade: Trade | null): Promise<TestAccount> {
  const suffix = randomBytes(4).toString("hex");
  const account = { email: `test-${suffix}@example.com`, password: randomBytes(24).toString("base64url") };
  const companyName = trade ? `${TRADE_LABELS[trade]} Test` : "Entreprise Test";

  const { error } = await createAdminClient().auth.admin.createUser({
    ...account,
    email_confirm: true,
    app_metadata: { test_account: true },
    user_metadata: {
      company_name: companyName,
      sms_sender_name: toSmsSenderNameOrFallback(companyName),
      trade,
      terms_version: LEGAL_VERSION,
    },
  });
  if (error) throw error;
  return account;
}

// Replaces the current session (admin or test account) with the test account's.
export async function signInAsTestAccount(account: TestAccount): Promise<void> {
  const { error } = await (await createClient()).auth.signInWithPassword(account);
  if (error) throw error;
}

// Deleting the user cascades to its company and all its data; photos live in Storage.
export async function deleteTestAccount(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!isTestAccount(user.user?.app_metadata)) throw new Error("Ce compte n'est pas un compte de test.");

  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", userId).maybeSingle();
  if (company) {
    const { data: photos } = await supabase.from("request_photos").select("storage_path").eq("company_id", company.id);
    const paths = (photos ?? []).map((photo) => photo.storage_path);
    if (paths.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    await removeGreetingAudio(company.id);
    await removeCompanyLogos(company.id);
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function deleteAllTestAccounts(): Promise<number> {
  const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: MAX_USERS_PER_PAGE });
  if (error) throw error;

  const testUsers = data.users.filter((user) => isTestAccount(user.app_metadata));
  for (const user of testUsers) await deleteTestAccount(user.id);
  return testUsers.length;
}

// Gives a test company a fictional number instead of buying one from the provider.
export async function assignFictionNumber(companyId: string): Promise<boolean> {
  const supabase = createAdminClient();
  for (let attempt = 0; attempt < NUMBER_ATTEMPTS; attempt++) {
    const { error } = await supabase
      .from("companies")
      .update({ phone_number: randomFictionLandline(), phone_number_sid: null })
      .eq("id", companyId)
      .is("phone_number", null);
    if (!error) return true;
    if (error.code !== UNIQUE_VIOLATION) throw error;
  }
  return false;
}
