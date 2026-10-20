import { WORLD_COUNTRIES, getWorldCountryByCode } from "@/lib/contact/world-countries";
import type { ShopCountry } from "@/lib/shop/types";

/** Store country as persisted in the `marketplace-currencies` document. */
export type StoreCountry = ShopCountry & {
  /** Hidden from the store when false. Missing means active (legacy docs). */
  active?: boolean;
};

export class CountriesValidationError extends Error {}

export function isCountryActive(country: object): boolean {
  return (country as { active?: boolean }).active !== false;
}

export function filterActiveCountries<T extends object>(countries: T[]): T[] {
  return countries.filter(isCountryActive);
}

/** Counts products that have each country flag enabled. */
export function countProductsByCountry(
  products: Array<{
    enabledCountries?: Record<string, boolean>;
    availability?: Record<string, boolean>;
  }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const product of products) {
    const map = product.enabledCountries ?? product.availability ?? {};
    for (const [code, enabled] of Object.entries(map)) {
      if (enabled) counts[code] = (counts[code] ?? 0) + 1;
    }
  }
  return counts;
}

export const MAX_CURRENCIES = 30;
const MAX_NAME_LENGTH = 80;

/**
 * Validates and normalizes the countries/currencies payload.
 * `offices` maps office id -> map-location flag (country code); `null` means the
 * map could not be read, so each country keeps its previous `primaryOfficeId`.
 */
export function normalizeCountriesPayload(
  payload: { countries?: unknown; currencies?: unknown },
  offices: Map<string, string> | null,
  previous: StoreCountry[] = []
): { countries: StoreCountry[]; currencies: string[]; warnings: string[] } {
  if (!Array.isArray(payload.countries) || !Array.isArray(payload.currencies)) {
    throw new CountriesValidationError("Invalid payload.");
  }
  if (payload.countries.length > WORLD_COUNTRIES.length) {
    throw new CountriesValidationError("Too many countries.");
  }
  const upperList = (value: unknown[], label: string) =>
    Array.from(
      new Set(
        value.map((item) => {
          if (typeof item !== "string") {
            throw new CountriesValidationError(`${label} must be text.`);
          }
          return item.trim().toUpperCase();
        })
      )
    );

  const currencies = upperList(payload.currencies, "Currency");
  if (currencies.length === 0) {
    throw new CountriesValidationError("At least one currency is required.");
  }
  if (currencies.length > MAX_CURRENCIES) {
    throw new CountriesValidationError(`At most ${MAX_CURRENCIES} currencies are allowed.`);
  }
  for (const code of currencies) {
    if (!/^[A-Z]{3,6}$/.test(code)) {
      throw new CountriesValidationError(`Invalid currency code: ${code}`);
    }
  }

  const warnings: string[] = [];
  const seen = new Set<string>();
  const countries = payload.countries.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new CountriesValidationError("Invalid country entry.");
    }
    const raw = entry as Record<string, unknown>;
    const code = typeof raw.code === "string" ? raw.code.trim().toUpperCase() : "";
    const world = /^[A-Z]{2}$/.test(code) ? getWorldCountryByCode(code) : undefined;
    if (!world) {
      throw new CountriesValidationError(`Invalid country code: ${code || "(empty)"}`);
    }
    if (seen.has(code)) {
      throw new CountriesValidationError(`Duplicate country: ${code}`);
    }
    seen.add(code);

    const list = upperList(Array.isArray(raw.currencies) ? raw.currencies : [], "Currency");
    if (list.length === 0) {
      throw new CountriesValidationError(`${world.name} must have at least one allowed currency.`);
    }
    if (list.length > MAX_CURRENCIES) {
      throw new CountriesValidationError(`${world.name} has too many currencies.`);
    }
    for (const currency of list) {
      if (!currencies.includes(currency)) {
        throw new CountriesValidationError(`${world.name} uses unknown currency: ${currency}`);
      }
    }
    const defaultCurrency =
      typeof raw.defaultCurrency === "string" ? raw.defaultCurrency.trim().toUpperCase() : "";
    if (!list.includes(defaultCurrency)) {
      throw new CountriesValidationError(
        `${world.name} default currency must be in allowed currencies list.`
      );
    }
    if (raw.primaryOfficeId != null && typeof raw.primaryOfficeId !== "string") {
      throw new CountriesValidationError(`${world.name} primary office is invalid.`);
    }
    let primaryOfficeId = (raw.primaryOfficeId as string | undefined)?.trim() || undefined;
    if (!offices) {
      primaryOfficeId = previous.find((c) => c.code === code)?.primaryOfficeId;
    } else if (primaryOfficeId) {
      const flag = offices.get(primaryOfficeId);
      if (flag === undefined) {
        warnings.push(`${world.name}: unknown primary office "${primaryOfficeId}" was removed.`);
        primaryOfficeId = undefined;
      } else if (flag.toUpperCase() !== code) {
        throw new CountriesValidationError(
          `${world.name} primary office belongs to another country: ${primaryOfficeId}`
        );
      }
    }
    const name =
      (typeof raw.name === "string" ? raw.name.trim().slice(0, MAX_NAME_LENGTH) : "") ||
      world.name;
    const country: StoreCountry = {
      code,
      name,
      currencies: list,
      defaultCurrency,
      active: raw.active !== false,
    };
    if (primaryOfficeId) country.primaryOfficeId = primaryOfficeId;
    return country;
  });

  return { countries, currencies, warnings };
}

/**
 * Splits a save into the part that can apply immediately and the
 * restrictive part (deactivating or removing countries) that needs approval.
 * `direct` keeps restrictive changes reverted to the current state.
 */
export function splitRestrictiveCountryChanges(
  current: StoreCountry[],
  proposed: StoreCountry[]
): { direct: StoreCountry[]; deactivate: string[]; remove: string[] } {
  const next = new Map(proposed.map((c) => [c.code, c]));
  const deactivate: string[] = [];
  const remove: string[] = [];
  for (const country of current) {
    const incoming = next.get(country.code);
    // Removal is permanent, so it is held even for already-inactive countries.
    if (!incoming) remove.push(country.code);
    else if (isCountryActive(country) && !isCountryActive(incoming)) deactivate.push(country.code);
  }
  const direct = proposed.map((c) =>
    deactivate.includes(c.code) ? { ...c, active: true } : c
  );
  for (const code of remove) {
    const original = current.find((c) => c.code === code);
    if (original) direct.push(original);
  }
  return { direct, deactivate, remove };
}

/** Applies approved deactivations/removals on top of the current countries. */
export function applyRestrictiveCountryChanges(
  current: StoreCountry[],
  changes: { deactivate: string[]; remove: string[] }
): StoreCountry[] {
  return current
    .filter((c) => !changes.remove.includes(c.code))
    .map((c) => (changes.deactivate.includes(c.code) ? { ...c, active: false } : c));
}

function countryKey(c: StoreCountry) {
  return JSON.stringify([
    c.code,
    c.name,
    [...c.currencies].sort(),
    c.defaultCurrency,
    isCountryActive(c),
    c.primaryOfficeId ?? null,
  ]);
}

/** True when both lists hold the same countries by code (order and default `active` ignored). */
export function sameCountries(a: StoreCountry[], b: StoreCountry[]): boolean {
  if (a.length !== b.length) return false;
  const left = new Map(a.map((c) => [c.code, countryKey(c)]));
  return b.every((c) => left.get(c.code) === countryKey(c));
}

/** Validates a stored approval payload; throws when malformed. */
export function parseCountryChanges(value: unknown): { deactivate: string[]; remove: string[] } {
  const raw = (value ?? {}) as { deactivate?: unknown; remove?: unknown };
  const check = (list: unknown) => {
    if (
      !Array.isArray(list) ||
      list.length > WORLD_COUNTRIES.length ||
      !list.every((code) => typeof code === "string" && /^[A-Z]{2}$/.test(code))
    ) {
      throw new CountriesValidationError("Invalid countries change payload.");
    }
    return list as string[];
  };
  return { deactivate: check(raw.deactivate), remove: check(raw.remove) };
}

/** Countries touched by a held change, as they were at submit time. */
export function snapshotAffectedCountries(
  current: StoreCountry[],
  changes: { deactivate: string[]; remove: string[] }
): StoreCountry[] {
  const codes = new Set([...changes.deactivate, ...changes.remove]);
  return current.filter((c) => codes.has(c.code));
}

/** Conflicts between a held change and the countries as they are now. */
export function detectCountryConflicts(
  current: StoreCountry[],
  snapshot: StoreCountry[],
  changes: { deactivate: string[]; remove: string[] }
): string[] {
  const now = new Map(current.map((c) => [c.code, c]));
  const before = new Map(snapshot.map((c) => [c.code, c]));
  const conflicts: string[] = [];
  const check = (code: string, deactivating: boolean) => {
    const entry = now.get(code);
    if (!entry) conflicts.push(`country_missing:${code}`);
    else if (deactivating && !isCountryActive(entry)) conflicts.push(`country_inactive:${code}`);
    else if (!before.has(code) || countryKey(before.get(code)!) !== countryKey(entry)) {
      conflicts.push(`country_changed:${code}`);
    }
  };
  changes.deactivate.forEach((code) => check(code, true));
  changes.remove.forEach((code) => check(code, false));
  return conflicts;
}
