import "server-only";

import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

type RateLimitResult = { ok: true } | { ok: false; error: string };

export async function assertFormRateLimit(input: {
  email: string;
  ipHash: string;
}): Promise<RateLimitResult> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    return { ok: true };
  }

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("cms_form_submissions")
    .select("data")
    .gte("created_at", since)
    .limit(200);

  if (error) {
    console.error("Rate limit lookup failed:", error.message);
    return {
      ok: false,
      error: "Too many requests. Please try again later.",
    };
  }

  const rows = (data ?? []) as Array<{ data?: Record<string, unknown> }>;
  const email = input.email.toLowerCase();
  let ipCount = 0;
  let emailCount = 0;

  for (const row of rows) {
    const payload = row.data ?? {};
    const rowEmail = String(payload.email ?? "").toLowerCase();
    const meta = (payload.meta ?? {}) as Record<string, unknown>;
    const rowHash = String(meta.ipHash ?? "");
    if (rowHash && rowHash === input.ipHash) ipCount += 1;
    if (rowEmail && rowEmail === email) emailCount += 1;
  }

  if (ipCount >= MAX_PER_IP || emailCount >= MAX_PER_EMAIL) {
    return { ok: false, error: "Too many requests. Please try again later." };
  }

  return { ok: true };
}

/**
 * Known, accepted limitation: the counts are read before the insert (check-then-insert), so concurrent requests
 * can briefly exceed the limits. An atomic counter needs a migration and is out of scope. The global brake is
 * deliberately high (300 / 10 min) to limit lockout risk. Recommended: also add a Vercel WAF rate-limit rule on
 * `/api/careers/*`.
 */
const MAX_GLOBAL_CAREERS = 300;

/** Exact head counts (no row fetch, no user input in filter strings) plus a global brake. */
export async function assertCareersApplyRateLimit(input: {
  email: string;
  ipHash: string;
}): Promise<RateLimitResult> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) return { ok: true };

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const admin = createServiceClient();
  const base = () =>
    admin
      .from("cms_job_applications")
      .select("id", { count: "exact", head: true })
      .eq("source", "website")
      .gte("created_at", since);

  const [global, byEmail, byIp] = await Promise.all([
    base(),
    base().eq("email", input.email.trim().toLowerCase()),
    base().eq("extra->meta->>ipHash", input.ipHash),
  ]);

  const failure = global.error ?? byEmail.error ?? byIp.error;
  if (failure) {
    console.error("Careers rate limit lookup failed:", failure.code ?? "db_error");
    return { ok: false, error: "Too many requests. Please try again later." };
  }
  if (
    (global.count ?? 0) > MAX_GLOBAL_CAREERS ||
    (byEmail.count ?? 0) >= MAX_PER_EMAIL ||
    (byIp.count ?? 0) >= MAX_PER_IP
  ) {
    return { ok: false, error: "Too many requests. Please try again later." };
  }
  return { ok: true };
}
