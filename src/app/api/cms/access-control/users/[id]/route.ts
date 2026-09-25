import { NextResponse } from "next/server";
import type { PermissionOverrides } from "@/lib/cms/types";
import { isValidRoleId } from "@/lib/cms/permissions/access-types";
import { readAccessControlDurable } from "@/lib/cms/server/access-control.server";
import {
  listCmsUsersDurable,
  updateCmsUserDurable,
} from "@/lib/cms/server/users.server";
import { cmsGuardSuperAdmin } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await cmsGuardSuperAdmin();
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = (await request.json()) as Partial<{
      role: string;
      status: "active" | "inactive";
      permissionOverrides: PermissionOverrides | null;
    }>;

    const users = await listCmsUsersDurable();
    const target = users.find((u) => u.id === id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const nextRole = body.role ?? target.role;
    if (!isValidRoleId(nextRole)) {
      return NextResponse.json({ error: "Invalid role id" }, { status: 400 });
    }

    const access = await readAccessControlDurable();
    const roleDef = access.roles.find((r) => r.id === nextRole);
    if (!roleDef || !roleDef.active) {
      return NextResponse.json(
        { error: "Role is not active" },
        { status: 400 }
      );
    }

    const nextStatus = body.status ?? target.status;

    // Cannot deactivate the last active Super Admin.
    if (
      (target.role === "super_admin" && nextRole !== "super_admin") ||
      (target.role === "super_admin" && nextStatus === "inactive")
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
      role: nextRole,
      status: body.status,
      permissionOverrides:
        body.permissionOverrides === undefined
          ? undefined
          : body.permissionOverrides,
    });

    return NextResponse.json(
      { ok: true, user },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("Failed to update access-control user:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 }
    );
  }
}
