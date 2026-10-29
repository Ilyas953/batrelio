import "server-only";
import type { Region, Trade } from "./details";
import type { LegalForm } from "./legal";

// Government company register: free, no key. https://recherche-entreprises.api.gouv.fr
const REGISTRY_URL = "https://recherche-entreprises.api.gouv.fr/search";
const REGISTRY_TIMEOUT_MS = 6000;

export type RegistryCompany = {
  name?: string;
  legalName?: string;
  legalForm?: LegalForm;
  nafCode?: string;
  trade?: Trade;
  addressLine?: string;
  postalCode?: string;
  city?: string;
  region?: Region;
  vatNumber?: string;
};

export type RegistryLookup =
  | { status: "found"; company: RegistryCompany; closed: boolean }
  | { status: "not_found" }
  | { status: "unavailable" };

// INSEE region codes.
const REGION_BY_INSEE_CODE: Record<string, Region> = {
  "84": "auvergne-rhone-alpes",
  "27": "bourgogne-franche-comte",
  "53": "bretagne",
  "24": "centre-val-de-loire",
  "94": "corse",
  "44": "grand-est",
  "32": "hauts-de-france",
  "11": "ile-de-france",
  "28": "normandie",
  "75": "nouvelle-aquitaine",
  "76": "occitanie",
  "52": "pays-de-la-loire",
  "93": "provence-alpes-cote-d-azur",
  "01": "guadeloupe",
  "02": "martinique",
  "03": "guyane",
  "04": "la-reunion",
  "06": "mayotte",
};

// NAF rev. 2 activity codes. A suggestion only: the artisan can change it.
const TRADE_BY_NAF_CODE: Record<string, Trade> = {
  "43.91A": "couvreur",
  "43.91B": "couvreur",
  "02.20Z": "elagueur",
  "02.40Z": "elagueur",
  "81.30Z": "paysagiste",
  "43.22A": "plombier",
  "43.22B": "chauffagiste",
  "43.21A": "electricien",
  "43.99C": "macon",
  "41.20A": "macon",
  "41.20B": "macon",
  "43.32A": "menuisier",
  "43.32B": "menuisier",
  "16.23Z": "menuisier",
  "43.34Z": "peintre",
};

// INSEE legal categories ("catégorie juridique").
function toLegalForm(code: string | undefined): LegalForm | undefined {
  if (!code) return undefined;
  if (code === "1000") return "ei";
  if (code === "5498") return "eurl";
  if (code === "5720") return "sasu";
  if (code.startsWith("54")) return "sarl";
  if (code.startsWith("57")) return "sas";
  if (code.startsWith("55") || code.startsWith("56")) return "sa";
  if (code.startsWith("52")) return "snc";
  return "autre";
}

// Sole traders can hide their name and address: the register then returns placeholders.
function readPublicValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || /\[ND\]|NON[ -]DIFFUSIBLE/i.test(trimmed)) return undefined;
  return trimmed;
}

const LOWERCASE_WORDS = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "sur", "sous", "aux", "au"]);

// The register writes in capitals: "35 ROUTE DE SORT" -> "35 Route de Sort".
function toTitleCase(text: string): string {
  if (text !== text.toUpperCase()) return text;

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) =>
      index > 0 && LOWERCASE_WORDS.has(word)
        ? word
        : word.replace(/(^|[-'’])(\p{L})/gu, (_, separator, letter) => separator + letter.toUpperCase()),
    )
    .join(" ");
}

function toStreet(fullAddress: string | undefined, postalCode: string | undefined): string | undefined {
  if (!fullAddress) return undefined;
  const postalCodeIndex = postalCode ? fullAddress.lastIndexOf(postalCode) : -1;
  const street = postalCodeIndex > 0 ? fullAddress.slice(0, postalCodeIndex) : fullAddress;
  return street.trim() || undefined;
}

type RegistryEstablishment = {
  siret?: string;
  adresse?: string;
  code_postal?: string;
  libelle_commune?: string;
  region?: string;
  etat_administratif?: string;
  nom_commercial?: string;
  activite_principale?: string;
};

type RegistryResult = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  nature_juridique?: string;
  activite_principale?: string;
  etat_administratif?: string;
  tva?: string[] | null;
  siege?: RegistryEstablishment;
  matching_etablissements?: RegistryEstablishment[];
};

function toRegistryCompany(result: RegistryResult, siret: string): { company: RegistryCompany; closed: boolean } {
  const establishment =
    result.matching_etablissements?.find((candidate) => candidate.siret === siret) ?? result.siege ?? {};

  // nom_complet reads "JULIEN DEGOUY (DEGOUY PATRIMOINE)" for a sole trader with a trading name.
  const fullName = readPublicValue(result.nom_complet);
  const legalName = readPublicValue(result.nom_raison_sociale) ?? fullName?.replace(/\s*\(.*\)\s*$/, "");
  const tradingName = readPublicValue(establishment.nom_commercial) ?? legalName;
  const postalCode = readPublicValue(establishment.code_postal);
  const nafCode = establishment.activite_principale ?? result.activite_principale;
  const street = toStreet(readPublicValue(establishment.adresse), postalCode);
  const city = readPublicValue(establishment.libelle_commune);

  return {
    closed: establishment.etat_administratif === "F" || result.etat_administratif === "C",
    company: {
      name: tradingName && toTitleCase(tradingName),
      legalName: legalName && toTitleCase(legalName),
      legalForm: toLegalForm(result.nature_juridique),
      nafCode,
      trade: nafCode ? TRADE_BY_NAF_CODE[nafCode] : undefined,
      addressLine: street && toTitleCase(street),
      postalCode: postalCode && /^[0-9]{5}$/.test(postalCode) ? postalCode : undefined,
      city: city && toTitleCase(city),
      region: establishment.region ? REGION_BY_INSEE_CODE[establishment.region] : undefined,
      vatNumber: result.tva?.[0],
    },
  };
}

export async function lookupCompanyBySiret(siret: string): Promise<RegistryLookup> {
  try {
    const url = `${REGISTRY_URL}?q=${siret}&per_page=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(REGISTRY_TIMEOUT_MS) });
    if (!response.ok) return { status: "unavailable" };

    const body = (await response.json()) as { results?: RegistryResult[] };
    const result = body.results?.find((candidate) => candidate.siren === siret.slice(0, 9));
    if (!result) return { status: "not_found" };

    return { status: "found", ...toRegistryCompany(result, siret) };
  } catch {
    return { status: "unavailable" };
  }
}
