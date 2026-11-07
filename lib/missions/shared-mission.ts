import { formatCents } from "@/lib/format";
import type { Enums } from "@/lib/supabase/database.types";

// A mission the artisan cannot take: Batrelio looks for another artisan by hand.

export type MissionStatus = Enums<"mission_status">;

// What the artisan who shares a mission earns when another artisan does the job:
// a share of what the customer actually pays, VAT included, paid by Batrelio once the job is paid.
export const SHARE_REWARD_PERCENT = 10;
export const SHARE_REWARD_LABEL = `+${SHARE_REWARD_PERCENT} %`;
export const SHARE_REWARD_PROMISE = `Si un autre artisan réalise le chantier, vous touchez ${SHARE_REWARD_PERCENT} % de ce que le client paie (TTC).`;

export function shareRewardCents(paidCents: number): number {
  return Math.round((paidCents * SHARE_REWARD_PERCENT) / 100);
}

const EXAMPLE_PAID_CENTS = 200_000;

export const SHARE_REWARD_STEPS = [
  "Vous partagez la mission : Batrelio trouve un autre artisan et prévient votre client.",
  "Le chantier est réalisé, puis payé par le client.",
  `Batrelio vous verse ${SHARE_REWARD_PERCENT} % du montant TTC payé, dès le paiement du chantier.`,
];

// "Exemple : le client paie 2 000 € TTC, vous recevez 200 €."
export const SHARE_REWARD_EXAMPLE = `Exemple : le client paie ${formatCents(EXAMPLE_PAID_CENTS)} TTC, vous recevez ${formatCents(shareRewardCents(EXAMPLE_PAID_CENTS))}.`;

export const MISSION_STATUSES: MissionStatus[] = ["to_place", "in_progress", "placed", "abandoned"];

// What Batrelio sees in the admin space.
export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  to_place: "À placer",
  in_progress: "En cours",
  placed: "Confiée",
  abandoned: "Abandonnée",
};

// What the artisan who shared it sees.
export const MISSION_STATUS_FOR_ARTISAN: Record<MissionStatus, string> = {
  to_place: "Batrelio cherche un artisan pour cette mission.",
  in_progress: "Batrelio cherche un artisan pour cette mission.",
  placed: `Mission confiée à un autre artisan. Vous toucherez ${SHARE_REWARD_PERCENT} % de ce que paiera le client, dès le paiement du chantier.`,
  abandoned: "Batrelio n'a pas trouvé d'artisan pour cette mission.",
};

export function isMissionStatus(value: unknown): value is MissionStatus {
  return typeof value === "string" && (MISSION_STATUSES as string[]).includes(value);
}

export const MAX_ARTISAN_NOTE_LENGTH = 1000;
export const MAX_ADMIN_NOTE_LENGTH = 2000;

// Optional free text: blank means none.
export function readNote(value: unknown, maxLength: number): { note: string | null } | { error: string } {
  const note = typeof value === "string" ? value.trim() : "";
  if (note.length > maxLength) return { error: `Le message est trop long (${maxLength} caractères au plus).` };
  return { note: note || null };
}
