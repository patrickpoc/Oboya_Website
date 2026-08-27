import { NextResponse } from "next/server";
import {
  createCmsUserDurable,
  listCmsUsersDurable,
  requireAdminActor,
} from "@/lib/cms/server/users.server";
import type { CmsLocale, CmsRole } from "@/lib/cms/types";

export async function GET() {
  const actor = await requireAdminActor();
  if (!actor) {
    return NextResponse.json(
      {
        error:
          "Unauthorized. Your account is not admin/super_admin yet. Run supabase/diagnostics/unlock-users-admin.sql in Supabase SQL Editor, confirm your email appears as super_admin, then log out and log in again. Also set SUPABASE_SERVICE_ROLE_KEY on Vercel and redeploy.",
      },
      { status: 401 }
    );
  }

  try {
    const users = await listCmsUsersDurable();
    return NextResponse.json({
      ok: true,
      users,
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await requireAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      role?: CmsRole;
      locale?: CmsLocale;
      jobTitle?: string;
      status?: "active" | "inactive";
    };

    if (!body.email?.trim() || !body.name?.trim() || !body.role) {
      return NextResponse.json(
        { error: "Name, email and role are required" },
        { status: 400 }
      );
    }

    const user = await createCmsUserDurable({
      email: body.email.trim().toLowerCase(),
      name: body.name.trim(),
      role: body.role,
      locale: body.locale,
      jobTitle: body.jobTitle?.trim(),
      status: body.status,
    });

    return NextResponse.json({
      ok: true,
      user,
      defaultPassword: "Oboya2026",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
