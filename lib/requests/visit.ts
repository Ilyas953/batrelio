// Proposing a visit: the artisan picks a day and a time (Paris time), Batrelio prepares the
// message and the artisan sends it from their own phone.

const PARIS = "Europe/Paris";
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_DAYS_AHEAD = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

const parisParts = new Intl.DateTimeFormat("en-US", {
  timeZone: PARIS,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// Minutes Paris is ahead of UTC at that instant: 60 in winter, 120 in summer.
function parisOffsetMinutes(at: Date): number {
  const parts = Object.fromEntries(parisParts.formatToParts(at).map((part) => [part.type, Number(part.value)]));
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}

// "2026-11-12" + "14:00" in Paris -> the matching instant. Null for an impossible date.
export function parisDateTime(date: string, time: string): Date | null {
  const day = DATE_PATTERN.exec(date);
  const hour = TIME_PATTERN.exec(time);
  if (!day || !hour) return null;

  const [year, month, dayOfMonth] = [Number(day[1]), Number(day[2]), Number(day[3])];
  const naive = Date.UTC(year, month - 1, dayOfMonth, Number(hour[1]), Number(hour[2]));
  // 31 février -> 3 mars: refused rather than silently moved.
  if (new Date(naive).getUTCDate() !== dayOfMonth || new Date(naive).getUTCMonth() !== month - 1) return null;

  // Twice, for the days the clocks change.
  const firstGuess = naive - parisOffsetMinutes(new Date(naive)) * 60000;
  return new Date(naive - parisOffsetMinutes(new Date(firstGuess)) * 60000);
}

export function readVisitInput(date: unknown, time: unknown, now: Date): { visitAt: Date } | { error: string } {
  if (typeof date !== "string" || !date) return { error: "Choisissez le jour de la visite." };
  if (typeof time !== "string" || !time) return { error: "Choisissez l'heure de la visite." };

  const visitAt = parisDateTime(date, time);
  if (!visitAt) return { error: "Cette date n'existe pas. Choisissez-en une autre." };
  if (visitAt.getTime() <= now.getTime()) return { error: "Cette date est déjà passée. Choisissez un jour à venir." };
  if (visitAt.getTime() > now.getTime() + MAX_DAYS_AHEAD * DAY_MS) {
    return { error: "Choisissez une date dans les 12 prochains mois." };
  }
  return { visitAt };
}

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, weekday: "long", day: "numeric", month: "long" });
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, weekday: "short", day: "numeric", month: "short" });

// 14:00 -> "14 h", 14:30 -> "14 h 30".
function formatHour(at: Date): string {
  const parts = Object.fromEntries(parisParts.formatToParts(at).map((part) => [part.type, part.value]));
  const hour = String(Number(parts.hour));
  return parts.minute === "00" ? `${hour} h` : `${hour} h ${parts.minute}`;
}

// "mardi 12 novembre à 14 h"
export function formatVisit(at: Date | string): string {
  const date = new Date(at);
  return `${dayFormatter.format(date)} à ${formatHour(date)}`;
}

// "mar. 12 nov. à 14 h", for lists.
export function formatVisitShort(at: Date | string): string {
  const date = new Date(at);
  return `${shortDayFormatter.format(date)} à ${formatHour(date)}`;
}

// Values for <input type="date"> and <input type="time">, in Paris time.
export function toVisitInputs(at: Date | string): { date: string; time: string } {
  const parts = Object.fromEntries(parisParts.formatToParts(new Date(at)).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

type VisitMessageInput = { companyName: string; customerName: string | null; visitAt: Date | string };

export function visitMessage({ companyName, customerName, visitAt }: VisitMessageInput): string {
  const greeting = customerName?.trim() ? `Bonjour ${customerName.trim()},` : "Bonjour,";
  return (
    `${greeting} c'est ${companyName}. Je vous propose de passer voir votre chantier le ${formatVisit(visitAt)}. ` +
    "Est-ce que cela vous convient ? Répondez-moi simplement à ce message."
  );
}
