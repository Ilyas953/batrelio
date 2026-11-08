"use server";

import { requireUser } from "@/lib/auth/session";
import { TOUR_DONE_KEY } from "@/lib/onboarding/tour";

// Remembered in the account, so the tour does not come back on another phone.
export async function markTourDone(): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ data: { [TOUR_DONE_KEY]: new Date().toISOString() } });
  // A fresh session carries the new value to the next page.
  if (!error) await supabase.auth.refreshSession();
}
