import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "data", "shop", "products.json");

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
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing environment variables for product seed.");
  if (!url) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const raw = readFileSync(dataPath, "utf-8");
const products = JSON.parse(raw);

const rows = products.map((p) => ({
  id: p.id,
  sku: p.sku,
  moq: p.moq ?? 1,
  brand_id: p.brandId,
  category_id: p.categoryId,
  subcategory_id: p.subcategoryId,
  images: p.images ?? [],
  tags: p.tags ?? [],
  availability: p.availability ?? {},
  enabled_countries: p.enabledCountries ?? p.availability ?? {},
  prices: p.prices ?? {},
  application: p.application ?? [],
  cultures: p.cultures ?? [],
  certifications: p.certifications ?? [],
  country_of_origin: p.countryOfOrigin ?? "",
  stock_status: p.stockStatus ?? "in_stock",
  stock_quantity: p.stockQuantity ?? null,
  unlimited_stock: p.unlimitedStock ?? true,
  specs: p.specs ?? [],
  documents: p.documents ?? [],
  related_product_ids: p.relatedProductIds ?? [],
  name: p.name ?? { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  short_description: p.shortDescription ?? { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  description: p.description ?? { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  status: p.status ?? "published",
  seo: p.seo ?? {
    title: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  },
  deleted_at: p.deletedAt ?? null,
  purge_at: p.purgeAt ?? null,
}));

const { error } = await supabase.from("cms_products").upsert(rows);
if (error) {
  console.error("Product seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded cms_products with ${rows.length} row(s).`);

