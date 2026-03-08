/**
 * Postal code / ZIP lookup for auto-filling city, state, and (when available) street.
 * Supports: US, CA, MX, BR (ViaCEP), GB, DE, FR, ES, IT, PT.
 */

export type LookupResult = {
  city: string;
  state: string;
  /** Street address when API provides it (e.g. Brazil ViaCEP). */
  street?: string;
};

/** Normalize and validate postal input per country. Returns null if invalid or unsupported. */
export function normalizePostal(countryCode: string, raw: string): string | null {
  const cleaned = raw.trim().replace(/\s+/g, "");
  const upper = cleaned.toUpperCase();
  const digitsOnly = cleaned.replace(/\D/g, "");

  switch (countryCode) {
    case "US":
      return digitsOnly.length >= 5 ? digitsOnly.slice(0, 5) : null;
    case "CA":
      return upper.replace(/[^A-Z0-9]/g, "").length >= 3 ? upper.replace(/[^A-Z0-9]/g, "").slice(0, 6) : null;
    case "MX":
      return digitsOnly.length >= 5 ? digitsOnly.slice(0, 5) : null;
    case "BR":
      return digitsOnly.length >= 8 ? digitsOnly.slice(0, 8) : null;
    case "GB":
      return upper.length >= 4 ? upper.slice(0, 8) : null;
    case "DE":
    case "FR":
    case "ES":
    case "IT":
      return digitsOnly.length >= 5 ? digitsOnly.slice(0, 5) : null;
    case "PT":
      return digitsOnly.length >= 7 ? digitsOnly.slice(0, 7) : null;
    case "AR":
    case "CL":
    case "CO":
      return digitsOnly.length >= 4 ? digitsOnly.slice(0, 8) : null;
    default:
      return null;
  }
}

/** Minimum length to trigger lookup per country. */
export function getMinLength(countryCode: string): number {
  switch (countryCode) {
    case "US":
    case "MX":
    case "DE":
    case "FR":
    case "ES":
    case "IT":
      return 5;
    case "CA":
      return 3;
    case "BR":
      return 8;
    case "PT":
      return 7;
    case "GB":
      return 4;
    case "AR":
    case "CL":
    case "CO":
      return 4;
    default:
      return 99;
  }
}

export function isPostalLookupSupported(countryCode: string): boolean {
  const supported = [
    "US",
    "CA",
    "MX",
    "BR",
    "GB",
    "DE",
    "FR",
    "ES",
    "IT",
    "PT",
    "AR",
    "CL",
    "CO",
  ];
  return supported.includes(countryCode);
}

/** Returns fetch URL for the given country and normalized postal, or null. */
export function getPostalLookupUrl(countryCode: string, normalized: string): string | null {
  if (!isPostalLookupSupported(countryCode)) return null;
  switch (countryCode) {
    case "US":
      return `https://api.zippopotam.us/us/${normalized}`;
    case "CA":
      return `https://api.zippopotam.us/ca/${normalized}`;
    case "MX":
      return `https://api.zippopotam.us/mx/${normalized}`;
    case "BR":
      return `https://viacep.com.br/ws/${normalized}/json/`;
    case "GB":
      return `https://api.zippopotam.us/gb/${encodeURIComponent(normalized)}`;
    case "DE":
      return `https://api.zippopotam.us/de/${normalized}`;
    case "FR":
      return `https://api.zippopotam.us/fr/${normalized}`;
    case "ES":
      return `https://api.zippopotam.us/es/${normalized}`;
    case "IT":
      return `https://api.zippopotam.us/it/${normalized}`;
    case "PT":
      return `https://api.zippopotam.us/pt/${normalized}`;
    case "AR":
      return `https://api.zippopotam.us/ar/${normalized}`;
    case "CL":
      return `https://api.zippopotam.us/cl/${normalized}`;
    case "CO":
      return `https://api.zippopotam.us/co/${normalized}`;
    default:
      return null;
  }
}

/** Parse Zippopotam response into LookupResult. */
function parseZippopotam(data: {
  places?: Array<{ "place name"?: string; state?: string; "state abbreviation"?: string }>;
}): LookupResult | null {
  const place = data?.places?.[0];
  if (!place) return null;
  return {
    city: place["place name"] || place.state || "",
    state: place["state abbreviation"] || place.state || "",
  };
}

/** Parse ViaCEP (Brazil) response. */
function parseViaCep(data: {
  localidade?: string;
  uf?: string;
  logradouro?: string;
  erro?: boolean;
}): LookupResult | null {
  if (data?.erro) return null;
  return {
    city: data.localidade || "",
    state: data.uf || "",
    street: data.logradouro || undefined,
  };
}

/** Fetch and parse postal lookup. Returns null on error or no data. */
export async function fetchPostalLookup(
  countryCode: string,
  normalized: string
): Promise<LookupResult | null> {
  const url = getPostalLookupUrl(countryCode, normalized);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;
  if (countryCode === "BR") return parseViaCep(data);
  return parseZippopotam(data);
}
