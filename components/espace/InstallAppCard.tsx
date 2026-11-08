"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// "Add to home screen": one tap on Android (the browser offers it), two gestures on iPhone.
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "batrelio:install-dismissed";
const subscribeToNothing = () => () => {};

function useDevice(): "installed" | "ios" | "other" | null {
  return useSyncExternalStore(
    subscribeToNothing,
    () => {
      const installed =
        window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      if (installed) return "installed";
      return /iPhone|iPad|iPod/.test(navigator.userAgent) ? "ios" : "other";
    },
    () => null,
  );
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED) === "1";
  } catch {
    return false;
  }
}

export function InstallAppCard({ dismissible = false }: { dismissible?: boolean }) {
  const device = useDevice();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(() => (dismissible ? readDismissedSafe() : false));

  useEffect(() => {
    const keep = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", keep);
    return () => window.removeEventListener("beforeinstallprompt", keep);
  }, []);

  // Nothing to offer: already installed, or a browser that cannot install (most computers).
  if (device === null || device === "installed" || dismissed) return null;
  if (device === "other" && !prompt) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Private browsing: shown again next time, harmless.
    }
  }

  return (
    <section data-tour="install" className="space-y-3 rounded-3xl bg-stone-900 p-5 text-white sm:p-6">
      <div>
        <p className="text-lg font-bold">📲 Batrelio sur votre écran d&apos;accueil</p>
        <p className="mt-1 text-base text-stone-300">Une icône, comme une appli : vos demandes en un tap, sans chercher le site.</p>
      </div>
      {prompt ? (
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            setPrompt(null);
          }}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-500"
        >
          Ajouter à l&apos;écran d&apos;accueil
        </button>
      ) : (
        <ol className="list-decimal space-y-1 pl-6 text-base text-stone-200">
          <li>
            Touchez le bouton <strong className="text-white">Partager</strong> (le carré avec une flèche vers le haut, en bas de Safari).
          </li>
          <li>
            Choisissez <strong className="text-white">« Sur l&apos;écran d&apos;accueil »</strong>, puis « Ajouter ».
          </li>
        </ol>
      )}
      {dismissible && (
        <button type="button" onClick={dismiss} className="text-base font-semibold text-stone-400 underline">
          Plus tard
        </button>
      )}
    </section>
  );
}

// localStorage is not available on the server: the card simply starts visible there.
function readDismissedSafe(): boolean {
  return typeof window === "undefined" ? false : readDismissed();
}
