import {
  WORLD_COUNTRIES,
  type WorldCountry,
} from "@/lib/contact/world-countries";

/** @deprecated Prefer WORLD_COUNTRIES — kept for existing imports. */
export const PHONE_COUNTRIES = WORLD_COUNTRIES;
export type PhoneCountry = WorldCountry;
