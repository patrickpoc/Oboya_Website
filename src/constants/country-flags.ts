export const countryFlagOptions = [
  { code: "US", label: "United States" },
  { code: "MX", label: "Mexico" },
  { code: "EC", label: "Ecuador" },
  { code: "CO", label: "Colombia" },
  { code: "PE", label: "Peru" },
  { code: "CL", label: "Chile" },
  { code: "BR", label: "Brazil" },
  { code: "AR", label: "Argentina" },
  { code: "NO", label: "Norway" },
  { code: "SE", label: "Sweden" },
  { code: "GB", label: "England" },
  { code: "PL", label: "Poland" },
  { code: "ET", label: "Ethiopia" },
  { code: "KE", label: "Kenya" },
  { code: "ZA", label: "South Africa" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "IN", label: "India" },
  { code: "CN", label: "China" },
  { code: "HK", label: "Hong Kong" },
  { code: "SG", label: "Singapore" },
] as const;

export type CountryFlagCode = (typeof countryFlagOptions)[number]["code"];

const emojiToCodeMap = new Map<string, CountryFlagCode>(
  countryFlagOptions.map((option) => {
    const emoji = String.fromCodePoint(
      ...option.code.split("").map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
    );
    return [emoji, option.code];
  })
);

const labelAliases: Record<string, CountryFlagCode> = {
  usa: "US",
  "u.s.a.": "US",
  "united states": "US",
  eua: "US",
  "ee. uu.": "US",
  mexico: "MX",
  méxico: "MX",
  ecuador: "EC",
  colombia: "CO",
  colômbia: "CO",
  peru: "PE",
  perú: "PE",
  chile: "CL",
  brazil: "BR",
  brasil: "BR",
  argentina: "AR",
  norway: "NO",
  noruega: "NO",
  sweden: "SE",
  suécia: "SE",
  suecia: "SE",
  england: "GB",
  inglaterra: "GB",
  "united kingdom": "GB",
  poland: "PL",
  polônia: "PL",
  polonia: "PL",
  ethiopia: "ET",
  etiópia: "ET",
  etiopia: "ET",
  kenya: "KE",
  quênia: "KE",
  kenia: "KE",
  "south africa": "ZA",
  "áfrica do sul": "ZA",
  sudáfrica: "ZA",
  "united arab emirates": "AE",
  uae: "AE",
  "emirados árabes unidos": "AE",
  india: "IN",
  índia: "IN",
  china: "CN",
  "hong kong": "HK",
  singapore: "SG",
  singapura: "SG",
};

export function getCountryCode(value: string): CountryFlagCode | "" {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase() as CountryFlagCode;
    return countryFlagOptions.some((option) => option.code === upper)
      ? upper
      : "";
  }

  const fromEmoji = emojiToCodeMap.get(trimmed);
  if (fromEmoji) return fromEmoji;

  return "";
}

export function suggestFlagByCountryName(country: string): CountryFlagCode | "" {
  const normalized = country.trim().toLowerCase();
  if (!normalized) return "";

  const alias = labelAliases[normalized];
  if (alias) return alias;

  const match = countryFlagOptions.find(
    (option) => option.label.toLowerCase() === normalized
  );

  return match?.code ?? "";
}

export function isValidFlagCode(flag: string): boolean {
  if (!flag) return true;
  return getCountryCode(flag) !== "";
}
