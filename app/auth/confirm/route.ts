import { NextResponse, type NextRequest } from "next/server";
import { EMAIL_LINK_TARGETS, isEmailLinkType } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";

// Landing point of the links sent by e-mail ("mot de passe oublié", confirmation): the one-time code
// is checked here, so the link works on any device, not only the one where it was requested.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && isEmailLinkType(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(EMAIL_LINK_TARGETS[type], request.url));
  }

  // Expired or already used: ask for a new one.
  const fallback = type === "recovery" ? "/mot-de-passe-oublie?expire=1" : "/connexion";
  return NextResponse.redirect(new URL(fallback, request.url));
}
