import "server-only";

import type {
  CmsLocale,
  CmsRole,
  CmsUser,
  PermissionOverrides,
} from "@/lib/cms/types";
import {
  deleteCmsUser,
  getCmsUserById,
  getCmsUsers,
  saveCmsUser,
} from "@/lib/cms/repositories/users-repository";
import { isValidRoleId } from "@/lib/cms/permissions/access-types";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { generateTemporaryPassword } from "@/lib/security/password";

type ProfileRow = {
  id: string;
  name: string;
  job_title: string | null;
  role: string;
  locale: string;
  status: string;
  must_change_password: boolean | null;
  permission_overrides?: unknown;
  created_at: string;
  updated_at: string;
};

function isCmsLocale(value: string): value is CmsLocale {
  return ["en", "pt-BR", "es", "zh-CN"].includes(value);
}

function parsePermissionOverrides(
  raw: unknown
): PermissionOverrides | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as PermissionOverrides;
  const grants =
    obj.grants && typeof obj.grants === "object" ? obj.grants : undefined;
  const denies =
    obj.denies && typeof obj.denies === "object" ? obj.denies : undefined;
  if (!grants && !denies) return undefined;
  return { grants, denies };
}

export function profileToCmsUser(
  profile: ProfileRow,
  email: string
): CmsUser {
  const overrides = parsePermissionOverrides(profile.permission_overrides);
  return {
    id: profile.id,
    email,
    name: profile.name || email.split("@")[0] || "User",
    jobTitle: profile.job_title ?? undefined,
    role: isValidRoleId(profile.role) ? profile.role : "viewer",
    locale: isCmsLocale(profile.locale) ? profile.locale : "en",
    status: profile.status === "inactive" ? "inactive" : "active",
    mustChangePassword: Boolean(profile.must_change_password),
    permissionOverrides: overrides,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function getOrCreateProfileForAuthUser(
  userId: string,
  email: string
): Promise<CmsUser | null> {
  if (!isSupabaseConfigured()) {
    return (
      getCmsUserById(userId) ??
      getCmsUsers().find((u) => u.email === email) ??
      null
    );
  }

  const supabase = await createClient();
  // Own-row reads by id go through the service client when available, so a recursive
  // profile policy cannot turn first login into a 500.
  const reader = isServiceRoleConfigured() ? createServiceClient() : supabase;
  const { data: existing, error: readError } = await reader
    .from("cms_user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  // A failed read is not "no row": provisioning on top of it could hit a real profile.
  if (readError) {
    throw new Error(`Could not read the profile: ${readError.message}`);
  }

  if (existing) {
    return profileToCmsUser(existing as ProfileRow, email);
  }

  const bootstrapEmail = process.env.CMS_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const isBootstrap =
    Boolean(bootstrapEmail && email.toLowerCase() === bootstrapEmail);

  let role: CmsRole = "viewer";
  let mustChange = true;
  if (isBootstrap && isServiceRoleConfigured()) {
    role = "super_admin";
    mustChange = false;
  }

  const now = new Date().toISOString();
  const row = {
    id: userId,
    name: email.split("@")[0] || "Admin",
    job_title: null as string | null,
    role,
    locale: "en",
    status: "active",
    must_change_password: mustChange,
    created_at: now,
    updated_at: now,
  };

  const writer = reader;

  // Never overwrite: if a row appeared meanwhile, the insert is skipped and we re-read it.
  const { data, error } = await writer
    .from("cms_user_profiles")
    .upsert(row, { onConflict: "id", ignoreDuplicates: true })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Failed to bootstrap user profile:", error.message);
    return null;
  }

  if (data) return profileToCmsUser(data as ProfileRow, email);

  const { data: raced, error: rereadError } = await reader
    .from("cms_user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (rereadError) throw new Error(`Could not read the profile: ${rereadError.message}`);
  return raced ? profileToCmsUser(raced as ProfileRow, email) : null;
}

export async function listCmsUsersDurable(): Promise<CmsUser[]> {
  if (!isSupabaseConfigured()) {
    return getCmsUsers();
  }

  if (isServiceRoleConfigured()) {
    const admin = createServiceClient();
    const [{ data: profiles, error: profileError }, authUsers] =
      await Promise.all([
        admin.from("cms_user_profiles").select("*").order("created_at"),
        admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      ]);

    if (profileError) {
      throw new Error(profileError.message);
    }
    if (authUsers.error) {
      throw new Error(authUsers.error.message);
    }

    const emailById = new Map(
      authUsers.data.users.map((u) => [u.id, u.email ?? ""])
    );

    const users =
      (profiles as ProfileRow[] | null)?.map((profile) =>
        profileToCmsUser(profile, emailById.get(profile.id) || "")
      ) ?? [];

    for (const user of users) saveCmsUser(user);
    return users;
  }

  // Fallback without service role: RLS admin policy must allow reading profiles.
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const { data: profiles, error } = await supabase
    .from("cms_user_profiles")
    .select("*")
    .order("created_at");

  if (error) {
    throw new Error(
      `${error.message}. Add SUPABASE_SERVICE_ROLE_KEY on Vercel for full Users & Permissions.`
    );
  }

  const users =
    (profiles as ProfileRow[] | null)?.map((profile) =>
      profileToCmsUser(
        profile,
        profile.id === authUser?.id ? authUser.email ?? "" : ""
      )
    ) ?? [];

  for (const user of users) saveCmsUser(user);
  return users;
}

export async function createCmsUserDurable(input: {
  email: string;
  name: string;
  role: CmsRole;
  locale?: CmsLocale;
  jobTitle?: string;
  status?: CmsUser["status"];
}): Promise<{ user: CmsUser; temporaryPassword: string }> {
  const temporaryPassword = generateTemporaryPassword();

  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const user: CmsUser = {
      id: `user-${Date.now()}`,
      email: input.email,
      name: input.name,
      role: input.role,
      locale: input.locale ?? "en",
      jobTitle: input.jobTitle,
      status: input.status ?? "active",
      mustChangePassword: true,
      createdAt: now,
      updatedAt: now,
    };
    return { user: saveCmsUser(user), temporaryPassword };
  }

  if (!isServiceRoleConfigured()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing on the server. Add it in Vercel → Settings → Environment Variables, then redeploy."
    );
  }

  const admin = createServiceClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name: input.name,
      },
      app_metadata: {
        must_change_password: true,
      },
    });

  if (createError || !created.user) {
    throw new Error(createError?.message || "Failed to create auth user");
  }

  const now = new Date().toISOString();
  const { data: profile, error: profileError } = await admin
    .from("cms_user_profiles")
    .upsert({
      id: created.user.id,
      name: input.name,
      job_title: input.jobTitle ?? null,
      role: input.role,
      locale: input.locale ?? "en",
      status: input.status ?? "active",
      must_change_password: true,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(profileError?.message || "Failed to create user profile");
  }

  const user = profileToCmsUser(profile as ProfileRow, input.email);
  saveCmsUser(user);
  return { user, temporaryPassword };
}

export async function updateCmsUserDurable(
  id: string,
  patch: Partial<{
    name: string;
    role: CmsRole;
    locale: CmsLocale;
    jobTitle: string;
    status: CmsUser["status"];
    email: string;
    permissionOverrides: PermissionOverrides | null;
  }>
): Promise<CmsUser> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    const existing = getCmsUserById(id);
    if (!existing) throw new Error("User not found");
    const { permissionOverrides: patchOverrides, ...rest } = patch;
    const next: CmsUser = {
      ...existing,
      ...rest,
      updatedAt: new Date().toISOString(),
    };
    if (patchOverrides === null) {
      delete next.permissionOverrides;
    } else if (patchOverrides !== undefined) {
      next.permissionOverrides = patchOverrides;
    }
    return saveCmsUser(next);
  }

  const admin = createServiceClient();
  const now = new Date().toISOString();

  if (patch.email) {
    const { error } = await admin.auth.admin.updateUserById(id, {
      email: patch.email,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  }

  if (patch.status === "inactive") {
    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: "876600h",
    });
    if (error) throw new Error(error.message);
  }
  if (patch.status === "active") {
    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (error) throw new Error(error.message);
  }

  const updates: Record<string, unknown> = { updated_at: now };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.role !== undefined) updates.role = patch.role;
  if (patch.locale !== undefined) updates.locale = patch.locale;
  if (patch.jobTitle !== undefined) updates.job_title = patch.jobTitle;
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.permissionOverrides === null) {
    updates.permission_overrides = {};
  } else if (patch.permissionOverrides !== undefined) {
    updates.permission_overrides = patch.permissionOverrides;
  }

  const { data: profile, error: profileError } = await admin
    .from("cms_user_profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message || "Failed to update user profile");
  }

  const { data: authUser } = await admin.auth.admin.getUserById(id);
  const user = profileToCmsUser(
    profile as ProfileRow,
    authUser.user?.email ?? patch.email ?? ""
  );
  saveCmsUser(user);
  return user;
}

export async function resetCmsUserPasswordDurable(
  id: string,
  password?: string
): Promise<string> {
  const nextPassword = password?.trim() || generateTemporaryPassword();
  if (nextPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    const existing = getCmsUserById(id);
    if (!existing) throw new Error("User not found");
    saveCmsUser({
      ...existing,
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    });
    return nextPassword;
  }

  const admin = createServiceClient();
  const { data: existingAuth } = await admin.auth.admin.getUserById(id);
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: nextPassword,
    user_metadata: {
      ...(existingAuth.user?.user_metadata ?? {}),
    },
    app_metadata: {
      ...(existingAuth.user?.app_metadata ?? {}),
      must_change_password: true,
    },
  });
  if (error) throw new Error(error.message);

  const { error: profileError } = await admin
    .from("cms_user_profiles")
    .update({
      must_change_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (profileError) throw new Error(profileError.message);
  return nextPassword;
}

/** `revoked`: auth delete failed but the account was banned or deactivated. `revocation_failed`: it also could not be deactivated. */
export class UserDeleteError extends Error {
  constructor(public code: "revoked" | "revocation_failed", detail: string) {
    super(detail);
    this.name = "UserDeleteError";
  }
}

function isAuthUserNotFound(error: { message?: string; status?: number; code?: string }) {
  return error.code === "user_not_found" || /user not found/i.test(error.message ?? "");
}

export async function deleteCmsUserDurable(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    deleteCmsUser(id);
    return;
  }
  if (!isServiceRoleConfigured()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing; the user cannot be deleted.");
  }

  const admin = createServiceClient();
  // Auth first. A missing auth user counts as done so a retry can finish.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error && !isAuthUserNotFound(error)) {
    // Keep the profile, but make sure the account cannot be used: ban the auth user
    // and deactivate the profile. Revoked only if one of them actually worked.
    const { error: banError } = await admin.auth.admin.updateUserById(id, {
      ban_duration: "876600h",
    });
    const { data: rows, error: profileUpdateError } = await admin
      .from("cms_user_profiles")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");
    const banned = !banError;
    const deactivated = !profileUpdateError && (rows?.length ?? 0) > 0;
    throw new UserDeleteError(banned || deactivated ? "revoked" : "revocation_failed", error.message);
  }
  const { error: profileError } = await admin.from("cms_user_profiles").delete().eq("id", id);
  if (profileError) throw new Error(profileError.message);
  deleteCmsUser(id);
}

export async function clearMustChangePassword(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const existing = getCmsUserById(userId);
    if (existing) {
      saveCmsUser({
        ...existing,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_user_profiles")
    .update({
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    // Fallback with service role if RLS blocks.
    if (isServiceRoleConfigured()) {
      const admin = createServiceClient();
      const { error: adminError } = await admin
        .from("cms_user_profiles")
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (adminError) throw new Error(adminError.message);
    } else {
      throw new Error(error.message);
    }
  }

  if (isServiceRoleConfigured()) {
    const admin = createServiceClient();
    const { data: existingAuth } = await admin.auth.admin.getUserById(userId);
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...(existingAuth.user?.app_metadata ?? {}),
        must_change_password: false,
      },
      user_metadata: {
        ...(existingAuth.user?.user_metadata ?? {}),
        must_change_password: false,
      },
    });
  }
}

export async function updateOwnProfileDurable(input: {
  name?: string;
  jobTitle?: string;
  locale?: CmsLocale;
}): Promise<CmsUser> {
  if (!isSupabaseConfigured()) {
    const users = getCmsUsers();
    const me = users[0];
    if (!me) throw new Error("No user");
    return saveCmsUser({
      ...me,
      name: input.name ?? me.name,
      jobTitle: input.jobTitle ?? me.jobTitle,
      locale: input.locale ?? me.locale,
      updatedAt: new Date().toISOString(),
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) updates.name = input.name;
  if (input.jobTitle !== undefined) updates.job_title = input.jobTitle;
  if (input.locale !== undefined) updates.locale = input.locale;

  const { data, error } = await supabase
    .from("cms_user_profiles")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update profile");
  }

  return profileToCmsUser(data as ProfileRow, user.email ?? "");
}
