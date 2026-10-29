import Link from "next/link";

export const LEGAL_PAGES = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgv", label: "Conditions générales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/sous-traitance", label: "Traitement des données" },
] as const;

type LegalLinksProps = { className?: string; linkClassName?: string };

export function LegalLinks({
  className = "",
  linkClassName = "text-stone-500 hover:text-stone-900",
}: LegalLinksProps) {
  return (
    <nav aria-label="Informations légales" className={className}>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {LEGAL_PAGES.map((page) => (
          <li key={page.href}>
            <Link href={page.href} className={linkClassName}>
              {page.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
