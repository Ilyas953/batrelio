"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { isTrade } from "@/lib/company/details";
import { createTestAccount, deleteAllTestAccounts, signInAsTestAccount } from "@/lib/simulation/test-accounts";

// Creates a blank test account and opens it in place of the admin session,
// so the admin lands where a new artisan lands after signing up.
export async function startTestAccount(formData: FormData): Promise<void> {
  await requireAdmin();
  const trade = String(formData.get("trade") ?? "");

  await signInAsTestAccount(await createTestAccount(isTrade(trade) ? trade : null));
  redirect("/espace/demarrage");
}

export async function removeTestAccounts(): Promise<void> {
  await requireAdmin();
  await deleteAllTestAccounts();
  redirect("/admin");
}
