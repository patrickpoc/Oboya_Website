import { locales, type Locale } from "@/i18n/routing";
import { isValidFlagCode, getCountryCode } from "@/constants/country-flags";

export const MAP_VIEWBOX = {
  width: 783.086,
  height: 400.649,
} as const;

export const MAP_LOCATION_FIELDS = [
  { key: "country", adminLabel: "Country", input: "text", prominent: true },
  { key: "company", adminLabel: "Company", input: "text", prominent: true },
  {
    key: "facility",
    adminLabel: "Facility",
    input: "textarea",
    prominent: false,
  },
  {
    key: "phone",
    adminLabel: "Phone",
    input: "text",
    prominent: true,
    href: "tel",
  },
] as const;

export type MapLocationFieldKey = (typeof MAP_LOCATION_FIELDS)[number]["key"];

export type MapLocationTranslation = Record<MapLocationFieldKey, string>;

export type MapLocation = {
  id: string;
  x: number;
  y: number;
  flag: string;
  translations: Record<Locale, MapLocationTranslation>;
};

export type MapLocationsData = {
  viewBox: { width: number; height: number };
  locations: MapLocation[];
};

export type ResolvedMapLocation = {
  id: string;
  x: number;
  y: number;
  flag: string;
} & MapLocationTranslation;

const emptyTranslation = (): MapLocationTranslation =>
  Object.fromEntries(
    MAP_LOCATION_FIELDS.map((field) => [field.key, ""])
  ) as MapLocationTranslation;

export function slugifyId(value: string, existingIds: string[]): string {
  let base = value
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^[0-9]+/, "");

  if (!base) {
    base = "location";
  }

  let id = base;
  let counter = 2;

  while (existingIds.includes(id)) {
    id = `${base}${counter}`;
    counter += 1;
  }

  return id;
}

export function createEmptyLocation(existingIds: string[]): MapLocation {
  const translations = Object.fromEntries(
    locales.map((locale) => [locale, emptyTranslation()])
  ) as Record<Locale, MapLocationTranslation>;

  return {
    id: slugifyId("new-location", existingIds),
    x: MAP_VIEWBOX.width / 2,
    y: MAP_VIEWBOX.height / 2,
    flag: "",
    translations,
  };
}

export function validateMapLocations(data: unknown): string[] {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return ["Payload must be an object"];
  }

  const payload = data as Record<string, unknown>;

  if (!payload.viewBox || typeof payload.viewBox !== "object") {
    errors.push("viewBox is required");
  } else {
    const viewBox = payload.viewBox as Record<string, unknown>;
    if (typeof viewBox.width !== "number" || typeof viewBox.height !== "number") {
      errors.push("viewBox.width and viewBox.height must be numbers");
    }
  }

  if (!Array.isArray(payload.locations)) {
    errors.push("locations must be an array");
    return errors;
  }

  const seenIds = new Set<string>();

  for (const [index, item] of payload.locations.entries()) {
    if (!item || typeof item !== "object") {
      errors.push(`locations[${index}] must be an object`);
      continue;
    }

    const location = item as Record<string, unknown>;
    const prefix = `locations[${index}]`;

    if (typeof location.id !== "string" || !location.id.trim()) {
      errors.push(`${prefix}.id is required`);
    } else if (seenIds.has(location.id)) {
      errors.push(`${prefix}.id "${location.id}" is duplicated`);
    } else {
      seenIds.add(location.id);
    }

    if (typeof location.x !== "number" || typeof location.y !== "number") {
      errors.push(`${prefix}.x and ${prefix}.y must be numbers`);
    }

    if (typeof location.flag !== "string") {
      errors.push(`${prefix}.flag must be a string`);
    } else if (!isValidFlagCode(location.flag)) {
      errors.push(`${prefix}.flag is not a supported country code`);
    }

    if (!location.translations || typeof location.translations !== "object") {
      errors.push(`${prefix}.translations is required`);
      continue;
    }

    const translations = location.translations as Record<string, unknown>;

    for (const locale of locales) {
      const translation = translations[locale];

      if (!translation || typeof translation !== "object") {
        errors.push(`${prefix}.translations.${locale} is required`);
        continue;
      }

      const fields = translation as Record<string, unknown>;

      for (const field of MAP_LOCATION_FIELDS) {
        if (typeof fields[field.key] !== "string") {
          errors.push(
            `${prefix}.translations.${locale}.${field.key} must be a string`
          );
        }
      }
    }
  }

  return errors;
}

export function resolveMapLocationsForLocale(
  locations: MapLocation[],
  locale: Locale
): ResolvedMapLocation[] {
  return locations.map((location) => {
    const translation =
      location.translations[locale] ?? location.translations.en;

    return {
      id: location.id,
      x: location.x,
      y: location.y,
      flag: getCountryCode(location.flag) || location.flag,
      ...Object.fromEntries(
        MAP_LOCATION_FIELDS.map((field) => [field.key, translation[field.key]])
      ),
    } as ResolvedMapLocation;
  });
}
