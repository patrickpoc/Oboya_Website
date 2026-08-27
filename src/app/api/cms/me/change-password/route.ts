import { NextResponse } from "next/server";
import { clearMustChangePassword } from "@/lib/cms/server/users.server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCmsUsers, saveCmsUser } from "@/lib/cms/repositories/users-repository";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim() ?? "";

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      const me = getCmsUsers()[0];
      if (me) {
        saveCmsUser({
          ...me,
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        });
      }
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await clearMustChangePassword(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to change password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
