import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/" aria-label="Batrelio, accueil">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>
      <footer className="border-t border-stone-200 bg-white">
        <LegalLinks className="mx-auto max-w-3xl px-4 py-6 sm:px-6" />
      </footer>
    </>
  );
}
