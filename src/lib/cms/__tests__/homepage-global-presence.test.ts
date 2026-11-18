import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getHomepageSettings,
  replaceHomepageSettingsCache,
  resetHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";

function load(value: unknown) {
  const doc = resetHomepageSettings() as unknown as Record<string, unknown>;
  const next = { ...(doc.globalPresence as Record<string, unknown>) };
  if (value === undefined) delete next.showConnections;
  else next.showConnections = value;
  replaceHomepageSettingsCache({ ...doc, globalPresence: next } as unknown as HomepageSettings);
  return getHomepageSettings().globalPresence.showConnections;
}

describe("globalPresence.showConnections", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to true when missing", () => expect(load(undefined)).toBe(true));
  it("keeps stored false", () => expect(load(false)).toBe(false));
  it("keeps stored true", () => expect(load(true)).toBe(true));
  it("non-boolean falls back to true", () => {
    expect(load("no")).toBe(true);
    expect(load(0)).toBe(true);
    expect(load(null)).toBe(true);
  });
});
