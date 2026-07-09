import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "data", "map-locations.json");

function loadEnvFile(filename) {
  const filePath = path.join(rootDir, filename);
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing environment variables for seeding.");
  if (!url) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) {
    console.error("- SUPABASE_SERVICE_ROLE_KEY");
    console.error(
      "  Get it from Supabase → Project Settings → API → service_role (secret). Add to .env.local only."
    );
  }
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const raw = readFileSync(dataPath, "utf-8");
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
