"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { PLACES } from "@/components/espace/places";
import { TONE_PILL, TONE_TEXT, TONE_TILE } from "@/components/espace/tones";

type Tab = (typeof PLACES)[keyof typeof PLACES] & { href: string; tourId: string; isActive: (path: string) => boolean };

// Three tabs, always in reach of the thumb: the artisan's day is requests, quotes, and rarely settings.
// Each tab has its own colour, found again on its pages.
const TABS: Tab[] = [
  { ...PLACES.requests, href: "/espace", tourId: "tab-demandes", isActive: (path) => path === "/espace" || path.startsWith("/espace/demandes") },
  { ...PLACES.quotes, href: "/espace/devis", tourId: "tab-devis", isActive: (path) => path.startsWith("/espace/devis") },
  {
    ...PLACES.settings,
    href: "/espace/reglages",
    tourId: "tab-reglages",
    isActive: (path) => !TABS[0].isActive(path) && !TABS[1].isActive(path),
  },
];

function useActiveTab(): string {
  const path = usePathname();
  return TABS.find((tab) => tab.isActive(path))?.href ?? TABS[0].href;
}

// The current URL is request data: until it is known (dynamic routes), the same tabs show
// without a highlighted one, so the bar never jumps.
function withActiveTab(View: (props: { active: string | null }) => React.ReactNode) {
  function Live() {
    return <View active={useActiveTab()} />;
  }
  return function TabsWithFallback() {
    return (
      <Suspense fallback={<View active={null} />}>
        <Live />
      </Suspense>
    );
  };
}

// Phones: fixed at the bottom of the screen, like a native app.
function BottomTabBarView({ active }: { active: string | null }) {
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-3">
        {TABS.map((tab) => {
          const isActive = tab.href === active;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                data-tour={tab.tourId}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
                  isActive ? TONE_TEXT[tab.tone] : "text-stone-500"
                }`}
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${isActive ? TONE_TILE[tab.tone] : ""}`}>
                  <tab.Icon className="size-6" />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Larger screens: the same tabs in the header.
function HeaderTabsView({ active }: { active: string | null }) {
  return (
    <nav aria-label="Menu principal" className="hidden items-center gap-1 sm:flex">
      {TABS.map((tab) => {
        const isActive = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
                data-tour={tab.tourId}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-semibold ${
              isActive ? `ring-1 ring-inset ${TONE_PILL[tab.tone]}` : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <tab.Icon className="size-5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const BottomTabBar = withActiveTab(BottomTabBarView);
export const HeaderTabs = withActiveTab(HeaderTabsView);
