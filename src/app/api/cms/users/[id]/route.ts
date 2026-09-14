import { NextResponse } from "next/server";
import {
  deleteCmsUserDurable,
  listCmsUsersDurable,
  updateCmsUserDurable,
} from "@/lib/cms/server/users.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import type { CmsLocale, CmsRole } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

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
    await deleteCmsUserDurable(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
