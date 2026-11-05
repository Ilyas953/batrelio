import { randomInt } from "node:crypto";

// ARCEP reserves these ranges for fiction: no real line answers there, so a test account
// can never forward calls to, or text, somebody real.
const FICTION_LANDLINE_PREFIX = "+3319900"; // 01 99 00 xx xx
const FICTION_MOBILE_PREFIX = "+3363998"; // 06 39 98 xx xx

function fourRandomDigits(): string {
  return String(randomInt(10_000)).padStart(4, "0");
}

export function randomFictionLandline(): string {
  return FICTION_LANDLINE_PREFIX + fourRandomDigits();
}

export function randomFictionMobile(): string {
  return FICTION_MOBILE_PREFIX + fourRandomDigits();
}
