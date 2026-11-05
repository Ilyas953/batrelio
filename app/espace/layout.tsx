import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/landing/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { getOptionalClaims, isTestAccount } from "@/lib/auth/session";
import { BottomTabBar, HeaderTabs } from "./TabBar";

export const metadata: Metadata = {
  title: "Mon espace · Batrelio",
  robots: { index: false },
};

// Access is checked in every page and Server Function, not here:
// layouts do not re-render on every navigation.
export default function ArtisanSpaceLayout({ children }: LayoutProps<"/espace">) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link href="/espace" aria-label="Batrelio, mon espace">
            <Logo className="text-stone-900" />
          </Link>
          <HeaderTabs />
        </div>
      </header>
      <Suspense fallback={null}>
        <TestAccountBanner />
      </Suspense>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-8 sm:px-6">{children}</main>
      {/* Room for the bottom tab bar on phones. */}
      <footer className="border-t border-stone-200 pb-20 sm:pb-0">
        <LegalLinks className="mx-auto max-w-2xl px-4 py-6 sm:px-6" />
      </footer>
      <BottomTabBar />
    </>
  );
}

// Display only: pages and Server Functions check the account themselves.
async function TestAccountBanner() {
  const claims = await getOptionalClaims();
  if (!isTestAccount(claims?.app_metadata)) return null;

  return (
    <div className="bg-sky-700 text-white">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-[15px] sm:px-6">
        <p>
          <strong>Compte de test</strong> · numéro fictif, aucun SMS envoyé
        </p>
        <Link href="/espace/simulation" className="font-semibold underline">
          Simuler un appel
        </Link>
      </div>
    </div>
  );
}
