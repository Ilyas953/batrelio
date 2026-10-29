import { Constants, type Enums } from "@/lib/supabase/database.types";

export type Trade = Enums<"trade">;
export type Region = Enums<"region">;

export const TRADE_LABELS: Record<Trade, string> = {
  couvreur: "Couvreur",
  elagueur: "Élagueur",
  paysagiste: "Paysagiste",
  plombier: "Plombier",
  chauffagiste: "Chauffagiste",
  electricien: "Électricien",
  macon: "Maçon",
  menuisier: "Menuisier",
  peintre: "Peintre",
  autre: "Autre",
};

export const REGION_LABELS: Record<Region, string> = {
  "auvergne-rhone-alpes": "Auvergne-Rhône-Alpes",
  "bourgogne-franche-comte": "Bourgogne-Franche-Comté",
  bretagne: "Bretagne",
  "centre-val-de-loire": "Centre-Val de Loire",
  corse: "Corse",
  "grand-est": "Grand Est",
  "hauts-de-france": "Hauts-de-France",
  "ile-de-france": "Île-de-France",
  normandie: "Normandie",
  "nouvelle-aquitaine": "Nouvelle-Aquitaine",
  occitanie: "Occitanie",
  "pays-de-la-loire": "Pays de la Loire",
  "provence-alpes-cote-d-azur": "Provence-Alpes-Côte d'Azur",
  guadeloupe: "Guadeloupe",
  martinique: "Martinique",
  guyane: "Guyane",
  "la-reunion": "La Réunion",
  mayotte: "Mayotte",
};

export function isTrade(value: string): value is Trade {
  return (Constants.public.Enums.trade as readonly string[]).includes(value);
}

export function isRegion(value: string): value is Region {
  return (Constants.public.Enums.region as readonly string[]).includes(value);
}

// La Poste establishments share one SIREN and use a different checksum.
const LA_POSTE_SIREN = "356000000";

function hasValidLuhnChecksum(digits: string): boolean {
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function sumDigits(digits: string): number {
  return [...digits].reduce((sum, digit) => sum + Number(digit), 0);
}

export function normalizeSiret(input: string): string {
  return input.replace(/[\s.-]/g, "");
}

export function isValidSiret(siret: string): boolean {
  if (!/^[0-9]{14}$/.test(siret)) return false;
  if (siret.startsWith(LA_POSTE_SIREN)) return sumDigits(siret) % 5 === 0;
  return hasValidLuhnChecksum(siret);
}

// 123 456 789 00012: SIREN in groups of 3, then the establishment number.
export function formatSiret(siret: string): string {
  return siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");
}
