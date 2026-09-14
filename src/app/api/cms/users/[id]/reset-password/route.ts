import { NextResponse } from "next/server";
import { resetCmsUserPasswordDurable } from "@/lib/cms/server/users.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await cmsGuard("users", "edit");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
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
