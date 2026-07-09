import "server-only";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { MapLocationsData } from "@/lib/map-locations";
import { normalizeMapLocations } from "@/lib/map-locations";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const DATA_PATH = path.join(process.cwd(), "data", "map-locations.json");
const MAP_CONFIG_ID = "default";

async function readMapLocationsFromFile(): Promise<MapLocationsData> {
  const raw = await readFile(DATA_PATH, "utf-8");
  return normalizeMapLocations(JSON.parse(raw));
}

async function writeMapLocationsToFile(data: MapLocationsData): Promise<void> {
  const normalized = normalizeMapLocations(data);
  await writeFile(DATA_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
}

export async function readMapLocations(): Promise<MapLocationsData> {
  if (!isSupabaseConfigured()) {
    return readMapLocationsFromFile();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("map_locations_config")
    .select("data")
    .eq("id", MAP_CONFIG_ID)
    .maybeSingle();

  if (error) {
    console.error("Supabase read map locations failed:", error);
    throw new Error("Failed to read map locations from Supabase");
  }

  if (!data?.data) {
    return readMapLocationsFromFile();
  }

  return normalizeMapLocations(data.data);
}

export async function writeMapLocations(data: MapLocationsData): Promise<void> {
  const normalized = normalizeMapLocations(data);

  if (!isSupabaseConfigured()) {
    return writeMapLocationsToFile(normalized);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("map_locations_config").upsert({
    id: MAP_CONFIG_ID,
    data: normalized,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Supabase write map locations failed:", error);
    throw new Error("Failed to write map locations to Supabase");
  }
}

export async function requireAdminUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
