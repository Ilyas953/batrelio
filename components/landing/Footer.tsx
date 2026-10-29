import { LegalLinks } from "@/components/legal/LegalLinks";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-stone-900 pb-28 text-stone-400 md:pb-0">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-sm sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-white" />
          <p>Ne perdez plus un client parce que vous étiez sur un chantier.</p>
        </div>
        <LegalLinks linkClassName="text-stone-400 hover:text-white" />
      </div>
    </footer>
  );
}
