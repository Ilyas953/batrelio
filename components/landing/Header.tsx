import Link from "next/link";
import { OFFER } from "@/lib/offer";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#calcul", label: "Combien je gagne" },
  { href: "#tarif", label: "Tarif" },
  { href: "#questions", label: "Questions" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Batrelio, accueil">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-stone-600 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-stone-900">
              {link.label}
            </a>
          ))}
        </nav>
        <Link
          href={OFFER.signupHref}
          className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-4 text-[15px] font-semibold text-white hover:bg-stone-700"
        >
          Essai gratuit
        </Link>
      </div>
    </header>
  );
}
