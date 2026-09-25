import { NextResponse } from "next/server";
import {
  deleteCmsUserDurable,
  listCmsUsersDurable,
  updateCmsUserDurable,
} from "@/lib/cms/server/users.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { isValidRoleId } from "@/lib/cms/permissions/access-types";
import type { CmsLocale, CmsRole, CmsUser } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

function rejectSuperAdminAssignment(
  actor: CmsUser,
  target: CmsUser | undefined,
  nextRole: string | undefined
): string | null {
  const actorIsSuper = actor.role === "super_admin";
  if (!actorIsSuper) {
    if (nextRole === "super_admin") {
      return "Only Super Admins can assign the Super Admin role";
    }
    if (target?.role === "super_admin") {
      return "Only Super Admins can edit Super Admin users";
    }
  }
  return null;
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await cmsGuard("users", "view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const users = await listCmsUsersDurable();
    const user = users.find((u) => u.id === id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Failed to load user:", error);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await cmsGuard("users", "edit");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const body = (await request.json()) as Partial<{
      name: string;
      email: string;
      role: CmsRole;
      locale: CmsLocale;
      jobTitle: string;
      status: "active" | "inactive";
    }>;

    const users = await listCmsUsersDurable();
    const target = users.find((u) => u.id === id);

    if (body.role !== undefined && !isValidRoleId(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const forbidden = rejectSuperAdminAssignment(
      auth.user,
      target,
      body.role
    );
    if (forbidden) {
      return NextResponse.json({ error: forbidden }, { status: 403 });
    }

    // Non-super admins cannot change status of super admins either.
    if (
      auth.user.role !== "super_admin" &&
      target?.role === "super_admin" &&
      body.status !== undefined
    ) {
      return NextResponse.json(
        { error: "Only Super Admins can edit Super Admin users" },
        { status: 403 }
      );
    }

    if (
      target?.role === "super_admin" &&
      ((body.role !== undefined && body.role !== "super_admin") ||
        body.status === "inactive")
    ) {
      const otherActiveSuper = users.some(
        (u) =>
          u.id !== id &&
          u.role === "super_admin" &&
          u.status === "active"
      );
      if (!otherActiveSuper) {
        return NextResponse.json(
          { error: "Cannot remove or deactivate the last Super Admin" },
          { status: 400 }
        );
      }
    }

    const user = await updateCmsUserDurable(id, {
      name: body.name?.trim(),
      email: body.email?.trim().toLowerCase(),
      role: body.role,
      locale: body.locale,
      jobTitle: body.jobTitle?.trim(),
      status: body.status,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await cmsGuard("users", "delete");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    const users = await listCmsUsersDurable();
    const target = users.find((u) => u.id === id);
    if (
      target?.role === "super_admin" &&
      auth.user.role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Only Super Admins can delete Super Admin users" },
        { status: 403 }
      );
    }
    if (target?.role === "super_admin") {
      const otherActiveSuper = users.some(
        (u) =>
          u.id !== id &&
          u.role === "super_admin" &&
          u.status === "active"
      );
      if (!otherActiveSuper) {
        return NextResponse.json(
          { error: "Cannot delete the last Super Admin" },
          { status: 400 }
        );
      }
    }

    await deleteCmsUserDurable(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
