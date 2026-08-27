import { NextResponse } from "next/server";
import {
  deleteCmsUserDurable,
  listCmsUsersDurable,
  requireAdminActor,
  updateCmsUserDurable,
} from "@/lib/cms/server/users.server";
import type { CmsLocale, CmsRole } from "@/lib/cms/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const actor = await requireAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const users = await listCmsUsersDurable();
    const user = users.find((u) => u.id === id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const actor = await requireAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const actor = await requireAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (id === actor.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    await deleteCmsUserDurable(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
