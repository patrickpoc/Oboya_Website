import { NextResponse } from "next/server";
import {
  DEFAULT_USER_PASSWORD,
  requireAdminActor,
  resetCmsUserPasswordDurable,
} from "@/lib/cms/server/users.server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const actor = await requireAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      password?: string;
    };
    const password = body.password?.trim() || DEFAULT_USER_PASSWORD;
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await resetCmsUserPasswordDurable(id, password);
    return NextResponse.json({
      ok: true,
      password,
      mustChangePassword: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
