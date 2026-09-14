import "server-only";

import { NextResponse } from "next/server";
import type { CmsAction, CmsModule, CmsUser } from "@/lib/cms/types";
import { canAccess } from "@/lib/cms/permissions/matrix";
import { getCmsUsers } from "@/lib/cms/repositories/users-repository";
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

export async function requireCmsAuth(input: {
  module: CmsModule;
  action?: CmsAction;
}): Promise<CmsAuthResult> {
  const action = input.action ?? "view";

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
    if (!canAccess(fallback.role, input.module, action)) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true, user: fallback };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const profile = await loadActiveProfile(user.id, user.email ?? "");
  if (!profile || profile.status !== "active") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (
    process.env.CMS_REQUIRE_MFA === "true" &&
    (profile.role === "super_admin" || profile.role === "admin")
  ) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      return {
        ok: false,
        status: 403,
        error: "Multi-factor authentication required",
      };
    }
  }

  if (!canAccess(profile.role, input.module, action)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, user: { ...profile, email: user.email ?? profile.email } };
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
