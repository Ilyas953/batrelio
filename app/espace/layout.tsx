import type { Metadata } from "next";
import Link from "next/link";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Mon espace · Batrelio",
  robots: { index: false },
};

// Access is checked in every page and Server Function, not here:
// layouts do not re-render on every navigation.
export default function ArtisanSpaceLayout({ children }: LayoutProps<"/espace">) {
  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link href="/espace" className="text-lg font-bold text-stone-900">
            Batrelio
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/espace/entreprise"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              Mon entreprise
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="min-h-11 rounded-xl px-3 text-[15px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                Se déconnecter
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-8 sm:px-6">{children}</main>
      <footer className="border-t border-stone-200">
        <LegalLinks className="mx-auto max-w-2xl px-4 py-6 sm:px-6" />
      </footer>
    </>
  );
}
