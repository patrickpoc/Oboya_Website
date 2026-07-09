import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
const password = process.env.ADMIN_PASSWORD ?? "OboyaAdmin2026!";

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

if (existing) {
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    existing.id,
    { password, email_confirm: true }
  );

  if (updateError) {
    console.error("Failed to update admin password:", updateError.message);
    process.exit(1);
  }

  console.log(`Admin user already exists. Password reset for ${email}`);
} else {
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.error("Failed to create admin user:", createError.message);
    process.exit(1);
  }

  console.log(`Created admin user ${email}`);
}

console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
