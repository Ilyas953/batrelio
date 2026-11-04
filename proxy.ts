import type { NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

// Only the signed-in areas need their session refreshed. Public pages (landing, sign-up,
// legal pages, customer links) are served straight from the CDN, without this round trip.
export const config = {
  matcher: ["/espace/:path*", "/admin/:path*", "/auth/:path*"],
};
