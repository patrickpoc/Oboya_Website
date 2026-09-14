import { NextResponse } from "next/server";
import {
  createCmsUserDurable,
  listCmsUsersDurable,
} from "@/lib/cms/server/users.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import type { CmsLocale, CmsRole } from "@/lib/cms/types";

export async function GET() {
  const auth = await cmsGuard("users", "view");
  if ("response" in auth) return auth.response;

  try {
    const users = await listCmsUsersDurable();
    return NextResponse.json({
      ok: true,
      users,
    });
  } catch (error) {
    console.error("Failed to list users:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await cmsGuard("users", "create");
  if ("response" in auth) return auth.response;

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

    const { user, temporaryPassword } = await createCmsUserDurable({
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
      temporaryPassword,
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
