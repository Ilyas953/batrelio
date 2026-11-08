import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prepareGreetingAudio } from "./greeting-audio";

// After the greeting, the voice or the company name changed: records the new version once the
// answer is sent, so the next missed call already plays it.
export function refreshGreetingAudioLater(companyId: string): void {
  after(async () => {
    const { data: company } = await createAdminClient()
      .from("companies")
      .select("id, name, greeting_intro, greeting_voice")
      .eq("id", companyId)
      .maybeSingle();
    if (company) await prepareGreetingAudio(company).catch((error) => console.error("Message d'accueil non préparé :", error));
  });
}
