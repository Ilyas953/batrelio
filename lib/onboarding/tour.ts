import { SHARE_REWARD_PERCENT } from "@/lib/missions/shared-mission";

// The first-visit tour: bubbles pointing at the places of the artisan space.
// Each target is an element with data-tour="…"; a step whose element is not on the page is skipped,
// unless it is worth saying anyway (then it shows in the middle of the screen).

export type TourStep = {
  id: string;
  // data-tour value of the element to point at; null: a message in the middle of the screen.
  target: string | null;
  title: string;
  text: string;
  // Shown in the middle when its element is not on this page.
  showWithoutTarget?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    title: "Bienvenue sur Batrelio 👋",
    text: "En une minute, on vous montre où arrivent vos clients, où sont vos devis et comment tout régler. Vous pouvez passer ce tuto à tout moment.",
  },
  // First what to do, then where things are: a new artisan has no client yet.
  {
    id: "setup",
    target: "setup",
    title: "Par où commencer",
    text: "Terminez la mise en place : 4 étapes, environ 5 minutes. Ensuite, un appel manqué ne vous fait plus perdre de client.",
  },
  {
    id: "requests-tab",
    target: "tab-demandes",
    title: "Demandes",
    text: "Deux listes : les demandes reçues, quand un client a décrit son besoin (vous recevez un SMS), et les appels manqués à rappeler, quand il n'a encore rien écrit.",
  },
  {
    id: "share",
    target: null,
    title: "Pas le temps ? Partagez la mission",
    text: `Vous ne pouvez pas prendre un chantier ? Ouvrez la demande et touchez « Partager la mission » : Batrelio trouve un autre artisan, et vous touchez ${SHARE_REWARD_PERCENT} % de ce que paie le client.`,
  },
  {
    id: "quotes-tab",
    target: "tab-devis",
    title: "Devis",
    text: "Batrelio prépare les lignes à partir de la demande et des photos. Votre client accepte le devis en ligne, et vous êtes prévenu par SMS.",
  },
  {
    id: "settings-tab",
    target: "tab-reglages",
    title: "Réglages",
    text: "Votre entreprise, votre numéro Batrelio, votre message d'accueil. C'est aussi là que vous pourrez revoir ce tuto.",
  },
  {
    id: "done",
    target: null,
    title: "C'est parti !",
    text: "Vous savez tout. Bon chantier !",
  },
];

// The steps to show on this page, in order.
export function stepsForPage(steps: TourStep[], isOnPage: (target: string) => boolean): TourStep[] {
  return steps.filter((step) => step.target === null || step.showWithoutTarget || isOnPage(step.target));
}

export type Box = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };
export type BubblePlacement = { top: number; left: number; side: "above" | "below" | "center"; arrowLeft: number };

const SCREEN_MARGIN = 16;
const GAP = 14;
const ARROW_INSET = 24;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

// Below the element when it fits, else above, always inside the screen.
export function placeBubble(target: Box | null, screen: Size, bubble: Size): BubblePlacement {
  if (!target) {
    return {
      top: Math.max(SCREEN_MARGIN, (screen.height - bubble.height) / 2),
      left: Math.max(SCREEN_MARGIN, (screen.width - bubble.width) / 2),
      side: "center",
      arrowLeft: 0,
    };
  }

  const targetCenter = target.left + target.width / 2;
  const left = clamp(targetCenter - bubble.width / 2, SCREEN_MARGIN, screen.width - bubble.width - SCREEN_MARGIN);
  const arrowLeft = clamp(targetCenter - left, ARROW_INSET, bubble.width - ARROW_INSET);

  const below = target.top + target.height + GAP;
  if (below + bubble.height <= screen.height - SCREEN_MARGIN) return { top: below, left, side: "below", arrowLeft };

  const above = target.top - GAP - bubble.height;
  return { top: Math.max(SCREEN_MARGIN, above), left, side: "above", arrowLeft };
}

// Stored in the account (user metadata) once the tour is finished or skipped.
export const TOUR_DONE_KEY = "tour_done_at";

export function hasFinishedTour(userMetadata: unknown): boolean {
  return typeof userMetadata === "object" && userMetadata !== null && typeof (userMetadata as Record<string, unknown>)[TOUR_DONE_KEY] === "string";
}
