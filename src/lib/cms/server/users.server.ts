import "server-only";

import type { CmsLocale, CmsRole, CmsUser } from "@/lib/cms/types";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  deleteCmsUser,
  getCmsUserById,
  getCmsUsers,
  saveCmsUser,
} from "@/lib/cms/repositories/users-repository";

export const DEFAULT_USER_PASSWORD = "Oboya2026";

type ProfileRow = {
  id: string;
  name: string;
  job_title: string | null;
  role: string;
  locale: string;
  status: string;
  must_change_password: boolean | null;
  created_at: string;
  updated_at: string;
};

function isCmsRole(value: string): value is CmsRole {
  return [
    "super_admin",
    "admin",
    "content_manager",
    "marketplace_manager",
    "sales_manager",
    "hr_manager",
    "viewer",
  ].includes(value);
}

function isCmsLocale(value: string): value is CmsLocale {
  return ["en", "pt-BR", "es", "zh-CN"].includes(value);
}

export function profileToCmsUser(
  profile: ProfileRow,
  email: string
): CmsUser {
  return {
    id: profile.id,
    email,
    name: profile.name || email.split("@")[0] || "User",
    jobTitle: profile.job_title ?? undefined,
    role: isCmsRole(profile.role) ? profile.role : "viewer",
    locale: isCmsLocale(profile.locale) ? profile.locale : "en",
    status: profile.status === "inactive" ? "inactive" : "active",
    mustChangePassword: Boolean(profile.must_change_password),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function requireAdminActor(): Promise<CmsUser | null> {
  if (!isSupabaseConfigured()) {
    return getCmsUsers()[0] ?? null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const me = await getOrCreateProfileForAuthUser(user.id, user.email ?? "");
  if (!me || me.status !== "active") return null;
  if (me.role !== "super_admin" && me.role !== "admin") return null;
  return me;
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
  const { data: existing } = await supabase
    .from("cms_user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return profileToCmsUser(existing as ProfileRow, email);
  }

  // Bootstrap first user as super_admin; later users default to viewer.
  let role: CmsRole = "viewer";
  let mustChange = true;
  try {
    if (isServiceRoleConfigured()) {
      const admin = createServiceClient();
      const { count } = await admin
        .from("cms_user_profiles")
        .select("id", { count: "exact", head: true });
      if (!count || count === 0) {
        role = "super_admin";
        mustChange = false;
      }
    }
  } catch {
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

  const { data, error } = await supabase
    .from("cms_user_profiles")
    .upsert(row)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to bootstrap user profile:", error?.message);
    return null;
  }

  return profileToCmsUser(data as ProfileRow, email);
}

export async function listCmsUsersDurable(): Promise<CmsUser[]> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    return getCmsUsers();
  }

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

  const users = (profiles as ProfileRow[] | null)?.map((profile) =>
    profileToCmsUser(profile, emailById.get(profile.id) || "")
  ) ?? [];

  // Keep in-memory mirror for other mock consumers.
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
}): Promise<CmsUser> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
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
    return saveCmsUser(user);
  }

  const admin = createServiceClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: DEFAULT_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        must_change_password: true,
        name: input.name,
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
  return user;
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
  }>
): Promise<CmsUser> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    const existing = getCmsUserById(id);
    if (!existing) throw new Error("User not found");
    return saveCmsUser({
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
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
  password = DEFAULT_USER_PASSWORD
): Promise<void> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    const existing = getCmsUserById(id);
    if (!existing) throw new Error("User not found");
    saveCmsUser({
      ...existing,
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const admin = createServiceClient();
  const { data: existingAuth } = await admin.auth.admin.getUserById(id);
  const { error } = await admin.auth.admin.updateUserById(id, {
    password,
    user_metadata: {
      ...(existingAuth.user?.user_metadata ?? {}),
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
}

export async function deleteCmsUserDurable(id: string): Promise<void> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    deleteCmsUser(id);
    return;
  }

  const admin = createServiceClient();
  await admin.from("cms_user_profiles").delete().eq("id", id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
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
