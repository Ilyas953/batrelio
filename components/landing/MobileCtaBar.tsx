import { CtaButton } from "./CtaButton";

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <CtaButton label="Essayer gratuitement" className="w-full" />
    </div>
  );
}
