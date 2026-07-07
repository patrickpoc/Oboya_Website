import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "data", "map-locations.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const raw = await readFile(dataPath, "utf-8");
const data = JSON.parse(raw);

const { error } = await supabase.from("map_locations_config").upsert({
  id: "default",
  data,
  updated_at: new Date().toISOString(),
});

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log("Seeded map_locations_config from data/map-locations.json");
