import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Admin · Batrelio",
  robots: { index: false },
};

const NAV_LINK = "inline-flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900";

// Access is checked in every page and Server Function, not here:
// layouts do not re-render on every navigation.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="text-lg font-bold text-stone-900">
            Batrelio <span className="font-medium text-orange-600">admin</span>
          </Link>
          <nav aria-label="Menu admin" className="flex flex-1 items-center gap-1">
            <Link href="/admin" className={NAV_LINK}>
              Comptes
            </Link>
            <Link href="/admin/missions" className={NAV_LINK}>
              Missions
            </Link>
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-xl px-3 text-[15px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </>
  );
}
