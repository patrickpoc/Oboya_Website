import { locales, type Locale } from "@/i18n/routing";
import {
  slugifyId,
  type MapLocation,
  type MapLocationsData,
  type MapOffice,
  type MapOfficeTranslation,
} from "@/lib/map-locations";

export type OverseasCompany = {
  locationId: string;
  company: string;
  city: string;
  registeredAddress: string;
};

export type OverseasImportSummary = {
  added: number;
  removedPlaceholders: number;
  createdLocations: string[];
};

const PLACEHOLDER_SUFFIX = "@oboya.example";

const NETHERLANDS: Omit<MapLocation, "offices"> = {
  id: "netherlands",
  x: 382,
  y: 88,
  flag: "NL",
  hasFactories: false,
  sendOnly: false,
  translations: {
    en: { country: "Netherlands" },
    "pt-BR": { country: "Países Baixos" },
    es: { country: "Países Bajos" },
    "zh-CN": { country: "荷兰" },
  },
};

const str = (value: unknown) => (typeof value === "string" ? value : "");

/** Whitelists seed rows (rule M8): any other property is dropped. */
export function parseOverseasSeed(raw: unknown): OverseasCompany[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const locationId = str(item.locationId).trim();
    const company = str(item.company).trim();
    if (!locationId || !company) return [];
    return [
      {
        locationId,
        company,
        city: str(item.city).trim(),
        registeredAddress: str(item.registeredAddress).trim(),
      },
    ];
  });
}

const isPlaceholder = (office: MapOffice) =>
  office.email.trim().toLowerCase().endsWith(PLACEHOLDER_SUFFIX);

const companyKey = (value: string) => value.trim().toLowerCase();

function seedOffice(id: string, seed: OverseasCompany): MapOffice {
  const translations = Object.fromEntries(
    locales.map((locale) => [
      locale,
      {
        company: seed.company,
        partner: "",
        operationType: "",
        city: seed.city,
        registeredAddress: seed.registeredAddress,
        facility: "",
        segments: "",
        phone: "",
        businessHours: "",
      } satisfies MapOfficeTranslation,
    ])
  ) as Record<Locale, MapOfficeTranslation>;

  return { id, email: "", showEmail: true, showPhone: true, translations };
}

/** Pure, idempotent merge of the overseas seed into map data (rules M1-M7). */
export function mergeOverseasCompanies(
  data: MapLocationsData,
  seed: OverseasCompany[]
): { data: MapLocationsData; summary: OverseasImportSummary } {
  const groups = new Map<string, OverseasCompany[]>();
  for (const company of seed) {
    groups.set(company.locationId, [
      ...(groups.get(company.locationId) ?? []),
      company,
    ]);
  }

  const summary: OverseasImportSummary = {
    added: 0,
    removedPlaceholders: 0,
    createdLocations: [],
  };

  let locations = data.locations;
  if (groups.has("netherlands") && !locations.some((l) => l.id === "netherlands")) {
    locations = [...locations, { ...NETHERLANDS, offices: [] }];
    summary.createdLocations.push("netherlands");
  }

  const merged = locations.map((location) => {
    const companies = groups.get(location.id);
    if (!companies) return location;

    const removed = location.offices.filter(isPlaceholder);
    const kept = location.offices.filter((office) => !isPlaceholder(office));
    const known = new Set(
      kept.flatMap((office) =>
        locales.map((locale) => companyKey(office.translations[locale]?.company ?? ""))
      )
    );
    known.delete("");

    const ids = kept.map((office) => office.id);
    const added: MapOffice[] = [];
    for (const company of companies) {
      const key = companyKey(company.company);
      if (known.has(key)) continue;
      known.add(key);
      const id =
        removed[added.length]?.id ??
        slugifyId(`${location.id}-${company.company}`, ids);
      ids.push(id);
      added.push(seedOffice(id, company));
    }

    summary.added += added.length;
    summary.removedPlaceholders += removed.length;
    return { ...location, offices: [...kept, ...added] };
  });

  return { data: { ...data, locations: merged }, summary };
}
