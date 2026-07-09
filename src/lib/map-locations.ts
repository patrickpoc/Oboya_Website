import { locales, type Locale } from "@/i18n/routing";
import { isValidFlagCode, getCountryCode } from "@/constants/country-flags";

export const MAP_VIEWBOX = {
  width: 783.086,
  height: 400.649,
} as const;

export const MAP_COUNTRY_FIELDS = [
  { key: "country", adminLabel: "Country", input: "text", prominent: true },
] as const;

export const MAP_OFFICE_FIELDS = [
  { key: "company", adminLabel: "Company", input: "text", prominent: true },
  { key: "partner", adminLabel: "Local Partner", input: "text", prominent: true },
  {
    key: "operationType",
    adminLabel: "Operation Type",
    input: "text",
    prominent: true,
  },
  { key: "city", adminLabel: "City", input: "text", prominent: true },
  {
    key: "facility",
    adminLabel: "Facility",
    input: "textarea",
    prominent: false,
  },
  {
    key: "segments",
    adminLabel: "Segments Served",
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
  {
    key: "businessHours",
    adminLabel: "Business Hours",
    input: "text",
    prominent: false,
  },
] as const;

export type MapCountryFieldKey = (typeof MAP_COUNTRY_FIELDS)[number]["key"];
export type MapOfficeFieldKey = (typeof MAP_OFFICE_FIELDS)[number]["key"];

export type MapCountryTranslation = Record<MapCountryFieldKey, string>;
export type MapOfficeTranslation = Record<MapOfficeFieldKey, string>;

/** @deprecated Use MAP_COUNTRY_FIELDS + MAP_OFFICE_FIELDS */
export const MAP_LOCATION_FIELDS = [
  ...MAP_COUNTRY_FIELDS,
  ...MAP_OFFICE_FIELDS,
] as const;

export type MapLocationFieldKey = MapCountryFieldKey | MapOfficeFieldKey;
export type MapLocationTranslation = MapCountryTranslation & MapOfficeTranslation;

export type MapOffice = {
  id: string;
  email: string;
  translations: Record<Locale, MapOfficeTranslation>;
};

export type MapLocation = {
  id: string;
  x: number;
  y: number;
  flag: string;
  translations: Record<Locale, MapCountryTranslation>;
  offices: MapOffice[];
};

export type MapLocationsData = {
  viewBox: { width: number; height: number };
  locations: MapLocation[];
};

export type ResolvedMapOffice = {
  id: string;
  email: string;
} & MapOfficeTranslation;

export type ResolvedMapLocation = {
  id: string;
  x: number;
  y: number;
  flag: string;
  country: string;
  offices: ResolvedMapOffice[];
};

const LEGACY_OFFICE_KEYS = MAP_OFFICE_FIELDS.map((field) => field.key);

const emptyCountryTranslation = (): MapCountryTranslation => ({ country: "" });

const emptyOfficeTranslation = (): MapOfficeTranslation =>
  Object.fromEntries(
    MAP_OFFICE_FIELDS.map((field) => [field.key, ""])
  ) as MapOfficeTranslation;

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

export function createEmptyOffice(
  locationId: string,
  existingOfficeIds: string[]
): MapOffice {
  const translations = Object.fromEntries(
    locales.map((locale) => [locale, emptyOfficeTranslation()])
  ) as Record<Locale, MapOfficeTranslation>;

  return {
    id: slugifyId(`${locationId}-office`, existingOfficeIds),
    email: "",
    translations,
  };
}

export function createEmptyLocation(existingIds: string[]): MapLocation {
  const id = slugifyId("new-location", existingIds);
  const translations = Object.fromEntries(
    locales.map((locale) => [locale, emptyCountryTranslation()])
  ) as Record<Locale, MapCountryTranslation>;

  return {
    id,
    x: MAP_VIEWBOX.width / 2,
    y: MAP_VIEWBOX.height / 2,
    flag: "",
    translations,
    offices: [createEmptyOffice(id, [])],
  };
}

function isLegacyTranslation(
  translation: Record<string, unknown>
): translation is MapLocationTranslation {
  return LEGACY_OFFICE_KEYS.some((key) => typeof translation[key] === "string");
}

export function normalizeMapOffice(
  office: unknown,
  locationId: string,
  index: number,
  existingIds: string[]
): MapOffice {
  if (!office || typeof office !== "object") {
    return createEmptyOffice(locationId, existingIds);
  }

  const item = office as Record<string, unknown>;
  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id
      : slugifyId(`${locationId}-office-${index + 1}`, existingIds);

  const translations = Object.fromEntries(
    locales.map((locale) => {
      const raw = item.translations as Record<string, unknown> | undefined;
      const translation = raw?.[locale];

      if (!translation || typeof translation !== "object") {
        return [locale, emptyOfficeTranslation()];
      }

      const fields = translation as Record<string, unknown>;
      return [
        locale,
        Object.fromEntries(
          MAP_OFFICE_FIELDS.map((field) => [
            field.key,
            typeof fields[field.key] === "string" ? fields[field.key] : "",
          ])
        ) as MapOfficeTranslation,
      ];
    })
  ) as Record<Locale, MapOfficeTranslation>;

  return {
    id,
    email: typeof item.email === "string" ? item.email : "",
    translations,
  };
}

export function normalizeMapLocation(location: unknown): MapLocation | null {
  if (!location || typeof location !== "object") return null;

  const item = location as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.x !== "number" ||
    typeof item.y !== "number" ||
    typeof item.flag !== "string"
  ) {
    return null;
  }

  const countryTranslations = Object.fromEntries(
    locales.map((locale) => {
      const raw = item.translations as Record<string, unknown> | undefined;
      const translation = raw?.[locale];

      if (!translation || typeof translation !== "object") {
        return [locale, emptyCountryTranslation()];
      }

      const fields = translation as Record<string, unknown>;
      return [
        locale,
        {
          country: typeof fields.country === "string" ? fields.country : "",
        } satisfies MapCountryTranslation,
      ];
    })
  ) as Record<Locale, MapCountryTranslation>;

  const officeIds: string[] = [];
  let offices: MapOffice[] = [];

  if (Array.isArray(item.offices) && item.offices.length > 0) {
    offices = item.offices.map((office, index) => {
      const normalized = normalizeMapOffice(
        office,
        item.id as string,
        index,
        officeIds
      );
      officeIds.push(normalized.id);
      return normalized;
    });
  } else {
    const legacyEmail =
      typeof item.email === "string" ? item.email : `${item.id}@oboya.example`;

    offices = locales.includes("en")
      ? [
          {
            id: slugifyId(`${item.id}-office`, []),
            email: legacyEmail,
            translations: Object.fromEntries(
              locales.map((locale) => {
                const raw = item.translations as Record<string, unknown> | undefined;
                const translation = raw?.[locale];

                if (!translation || typeof translation !== "object") {
                  return [locale, emptyOfficeTranslation()];
                }

                const fields = translation as Record<string, unknown>;
                return [
                  locale,
                  Object.fromEntries(
                    MAP_OFFICE_FIELDS.map((field) => [
                      field.key,
                      typeof fields[field.key] === "string" ? fields[field.key] : "",
                    ])
                  ) as MapOfficeTranslation,
                ];
              })
            ) as Record<Locale, MapOfficeTranslation>,
          },
        ]
      : [];
  }

  if (offices.length === 0) {
    offices = [createEmptyOffice(item.id as string, [])];
  }

  return {
    id: item.id,
    x: item.x,
    y: item.y,
    flag: item.flag,
    translations: countryTranslations,
    offices,
  };
}

export function normalizeMapLocations(data: unknown): MapLocationsData {
  if (!data || typeof data !== "object") {
    return {
      viewBox: { width: MAP_VIEWBOX.width, height: MAP_VIEWBOX.height },
      locations: [],
    };
  }

  const payload = data as Record<string, unknown>;
  const viewBoxRaw = payload.viewBox as Record<string, unknown> | undefined;

  return {
    viewBox: {
      width:
        typeof viewBoxRaw?.width === "number"
          ? viewBoxRaw.width
          : MAP_VIEWBOX.width,
      height:
        typeof viewBoxRaw?.height === "number"
          ? viewBoxRaw.height
          : MAP_VIEWBOX.height,
    },
    locations: Array.isArray(payload.locations)
      ? payload.locations
          .map((location) => normalizeMapLocation(location))
          .filter((location): location is MapLocation => location !== null)
      : [],
  };
}

export function validateMapLocations(data: unknown): string[] {
  const errors: string[] = [];
  const normalized = normalizeMapLocations(data);

  if (!data || typeof data !== "object") {
    return ["Payload must be an object"];
  }

  const payload = data as Record<string, unknown>;
  if (!payload.viewBox || typeof payload.viewBox !== "object") {
    errors.push("viewBox is required");
  }

  if (!Array.isArray(payload.locations)) {
    errors.push("locations must be an array");
    return errors;
  }

  const seenIds = new Set<string>();

  for (const [index, location] of normalized.locations.entries()) {
    const prefix = `locations[${index}]`;

    if (seenIds.has(location.id)) {
      errors.push(`${prefix}.id "${location.id}" is duplicated`);
    } else {
      seenIds.add(location.id);
    }

    if (!isValidFlagCode(location.flag) && location.flag !== "") {
      errors.push(`${prefix}.flag is not a supported country code`);
    }

    for (const locale of locales) {
      if (typeof location.translations[locale]?.country !== "string") {
        errors.push(`${prefix}.translations.${locale}.country must be a string`);
      }
    }

    if (location.offices.length === 0) {
      errors.push(`${prefix}.offices must contain at least one office`);
    }

    const officeIds = new Set<string>();
    for (const [officeIndex, office] of location.offices.entries()) {
      const officePrefix = `${prefix}.offices[${officeIndex}]`;

      if (!office.id.trim()) {
        errors.push(`${officePrefix}.id is required`);
      } else if (officeIds.has(office.id)) {
        errors.push(`${officePrefix}.id "${office.id}" is duplicated`);
      } else {
        officeIds.add(office.id);
      }

      if (typeof office.email !== "string") {
        errors.push(`${officePrefix}.email must be a string`);
      }

      for (const locale of locales) {
        const translation = office.translations[locale];
        for (const field of MAP_OFFICE_FIELDS) {
          if (typeof translation[field.key] !== "string") {
            errors.push(
              `${officePrefix}.translations.${locale}.${field.key} must be a string`
            );
          }
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
    const countryTranslation =
      location.translations[locale] ?? location.translations.en;

    return {
      id: location.id,
      x: location.x,
      y: location.y,
      flag: getCountryCode(location.flag) || location.flag,
      country: countryTranslation.country,
      offices: location.offices.map((office) => {
        const translation =
          office.translations[locale] ?? office.translations.en;

        return {
          id: office.id,
          email: office.email,
          ...Object.fromEntries(
            MAP_OFFICE_FIELDS.map((field) => [field.key, translation[field.key]])
          ),
        } as ResolvedMapOffice;
      }),
    };
  });
}
