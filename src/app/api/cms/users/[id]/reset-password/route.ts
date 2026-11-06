import { NextResponse } from "next/server";
import {
  listCmsUsersDurable,
  resetCmsUserPasswordDurable,
} from "@/lib/cms/server/users.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await cmsGuard("users", "edit");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const target = (await listCmsUsersDurable()).find((u) => u.id === id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "super_admin" && auth.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only Super Admins can reset a Super Admin password" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      password?: string;
    };
    const password = await resetCmsUserPasswordDurable(id, body.password);
    return NextResponse.json({
      ok: true,
      password,
      mustChangePassword: true,
    });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
