import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PASSWORD = "Oboya2026";

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
const email = process.env.ADMIN_EMAIL ?? "admin@oboya.cc";
const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Oboya Admin";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existingUsers, error: listError } =
  await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });

if (listError) {
  console.error("Failed to list users:", listError.message);
  process.exit(1);
}

const existing = existingUsers.users.find(
  (user) => user.email?.toLowerCase() === email.toLowerCase()
);

let userId;

if (existing) {
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    existing.id,
    {
      password,
      email_confirm: true,
      user_metadata: {
        must_change_password: false,
        name,
      },
    }
  );

  if (updateError) {
    console.error("Failed to update admin password:", updateError.message);
    process.exit(1);
  }

  userId = existing.id;
  console.log(`Admin user already exists. Password reset for ${email}`);
} else {
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        must_change_password: false,
        name,
      },
    });

  if (createError || !created.user) {
    console.error(
      "Failed to create admin user:",
      createError?.message || "Unknown error"
    );
    process.exit(1);
  }

  userId = created.user.id;
  console.log(`Created admin user ${email}`);
}

const now = new Date().toISOString();
const { error: profileError } = await supabase.from("cms_user_profiles").upsert({
  id: userId,
  name,
  job_title: "Super Administrator",
  role: "super_admin",
  locale: "en",
  status: "active",
  must_change_password: false,
  created_at: now,
  updated_at: now,
});

if (profileError) {
  console.error("Failed to upsert admin profile:", profileError.message);
  console.error(
    "Run supabase/cms-schema.sql and supabase/migrations/20260827_cms_user_profiles.sql first."
  );
  process.exit(1);
}

console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
console.log("Profile: super_admin (must_change_password = false)");
