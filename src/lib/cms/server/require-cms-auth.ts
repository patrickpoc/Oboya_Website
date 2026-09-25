import "server-only";

import { cache } from "react";
import { NextResponse } from "next/server";
import type { CmsAction, CmsModule, CmsUser } from "@/lib/cms/types";
import { canAccessUser } from "@/lib/cms/permissions/matrix";
import { getCmsUsers } from "@/lib/cms/repositories/users-repository";
import { ensureAccessControlHydrated } from "@/lib/cms/server/access-control.server";
import { profileToCmsUser } from "@/lib/cms/server/users.server";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isHostedRuntime } from "@/lib/security/runtime";

type ProfileRow = Parameters<typeof profileToCmsUser>[0];

export type CmsAuthOk = { ok: true; user: CmsUser };
export type CmsAuthFail = {
  ok: false;
  status: 401 | 403 | 503;
  error: string;
};
export type CmsAuthResult = CmsAuthOk | CmsAuthFail;

/** Cross-request memo of session+profile within one serverless isolate. */
const SESSION_TTL_MS = 45_000;
const sessionCache = new Map<
  string,
  { expiresAt: number; result: CmsAuthOk }
>();

function getCachedSession(userId: string): CmsAuthOk | null {
  const hit = sessionCache.get(userId);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    sessionCache.delete(userId);
    return null;
  }
  return hit.result;
}

function setCachedSession(userId: string, result: CmsAuthOk) {
  sessionCache.set(userId, {
    expiresAt: Date.now() + SESSION_TTL_MS,
    result,
  });
}

function invalidateCachedSession(userId?: string) {
  if (userId) sessionCache.delete(userId);
  else sessionCache.clear();
}

async function loadActiveProfile(userId: string, email: string): Promise<CmsUser | null> {
  if (isServiceRoleConfigured()) {
    const admin = createServiceClient();
    const { data } = await admin
      .from("cms_user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    return profileToCmsUser(data as ProfileRow, email);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return profileToCmsUser(data as ProfileRow, email);
}

/** Deduplicates auth+profile within a single RSC/request tree. */
const resolveCmsSessionUser = cache(async (): Promise<CmsAuthResult> => {
  if (!isSupabaseConfigured()) {
    if (isHostedRuntime()) {
      return {
        ok: false,
        status: 503,
        error: "Service unavailable",
      };
    }
    const fallback = getCmsUsers()[0];
    if (!fallback) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    return { ok: true, user: fallback };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    invalidateCachedSession();
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const cached = getCachedSession(user.id);
  if (cached) {
    return {
      ok: true,
      user: { ...cached.user, email: user.email ?? cached.user.email },
    };
  }

  const profile = await loadActiveProfile(user.id, user.email ?? "");
  if (!profile || profile.status !== "active") {
    invalidateCachedSession(user.id);
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (
    process.env.CMS_REQUIRE_MFA === "true" &&
    (profile.role === "super_admin" || profile.role === "admin")
  ) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      invalidateCachedSession(user.id);
      return {
        ok: false,
        status: 403,
        error: "Multi-factor authentication required",
      };
    }
  }

  const ok: CmsAuthOk = {
    ok: true,
    user: { ...profile, email: user.email ?? profile.email },
  };
  setCachedSession(user.id, ok);
  return ok;
});

export async function requireCmsAuth(input: {
  module: CmsModule;
  action?: CmsAction;
}): Promise<CmsAuthResult> {
  const action = input.action ?? "view";
  await ensureAccessControlHydrated();
  const session = await resolveCmsSessionUser();
  if (!session.ok) return session;

  if (!canAccessUser(session.user, input.module, action)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return session;
}

/** Active CMS session only (no module check) — used to hydrate access matrix. */
export async function requireCmsSession(): Promise<CmsAuthResult> {
  await ensureAccessControlHydrated();
  return resolveCmsSessionUser();
}

export async function cmsGuardSession(): Promise<
  { user: CmsUser } | { response: NextResponse }
> {
  const result = await requireCmsSession();
  if (!result.ok) {
    return {
      response: NextResponse.json(
        { error: result.error },
        { status: result.status }
      ),
    };
  }
  return { user: result.user };
}

/** Super Admin only — Access Control APIs/UI. */
export async function requireSuperAdmin(): Promise<CmsAuthResult> {
  await ensureAccessControlHydrated();
  const session = await resolveCmsSessionUser();
  if (!session.ok) return session;
  if (session.user.role !== "super_admin") {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return session;
}

export async function cmsGuardSuperAdmin(): Promise<
  { user: CmsUser } | { response: NextResponse }
> {
  const result = await requireSuperAdmin();
  if (!result.ok) {
    return {
      response: NextResponse.json(
        { error: result.error },
        { status: result.status }
      ),
    };
  }
  return { user: result.user };
}

export async function cmsGuard(
  module: CmsModule,
  action: CmsAction = "view"
): Promise<{ user: CmsUser } | { response: NextResponse }> {
  const result = await requireCmsAuth({ module, action });
  if (!result.ok) {
    return {
      response: NextResponse.json(
        { error: result.error },
        { status: result.status }
      ),
    };
  }
  return { user: result.user };
}

/** Succeeds if any of the module/action pairs is allowed. */
export async function cmsGuardAny(
  checks: Array<{ module: CmsModule; action: CmsAction }>
): Promise<{ user: CmsUser } | { response: NextResponse }> {
  let lastFail: CmsAuthFail | null = null;
  for (const check of checks) {
    const result = await requireCmsAuth(check);
    if (result.ok) return { user: result.user };
    lastFail = result;
    if (result.status === 401 || result.status === 503) {
      return {
        response: NextResponse.json(
          { error: result.error },
          { status: result.status }
        ),
      };
    }
  }
  return {
    response: NextResponse.json(
      { error: lastFail?.error ?? "Forbidden" },
      { status: lastFail?.status ?? 403 }
    ),
  };
}
