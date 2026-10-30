import type { NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  matcher: [
    // Skip static files, images and telephony webhooks: they never carry a session.
    "/((?!_next/static|_next/image|favicon.ico|api/twilio/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
