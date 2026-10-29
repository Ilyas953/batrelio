const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return euroFormatter.format(Math.round(cents / 100));
}

// +33612345678 -> 06 12 34 56 78. Foreign numbers stay in international format.
export function formatPhone(e164: string): string {
  const frenchNumber = e164.match(/^\+33(\d{9})$/);
  if (!frenchNumber) return e164;
  return `0${frenchNumber[1]}`.replace(/(\d{2})(?=\d)/g, "$1 ");
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

const RELATIVE_TIME_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60],
  ["hour", 60 * 60],
  ["day", 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
];

// "il y a 2 heures", "hier", "il y a 3 jours".
export function formatTimeAgo(isoDate: string, now: Date): string {
  const secondsAgo = Math.max(0, (now.getTime() - new Date(isoDate).getTime()) / 1000);
  if (secondsAgo < 60) return "à l'instant";

  const [unit, unitSeconds] =
    RELATIVE_TIME_STEPS.findLast(([, seconds]) => secondsAgo >= seconds) ?? RELATIVE_TIME_STEPS[0];
  return relativeTimeFormatter.format(-Math.floor(secondsAgo / unitSeconds), unit);
}
