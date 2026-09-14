import { NextResponse } from "next/server";
import { clearMustChangePassword } from "@/lib/cms/server/users.server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCmsUsers, saveCmsUser } from "@/lib/cms/repositories/users-repository";
import { isHostedRuntime } from "@/lib/security/runtime";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      password?: string;
      currentPassword?: string;
    };
    const password = body.password?.trim() ?? "";
    const currentPassword = body.currentPassword?.trim() ?? "";

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      if (isHostedRuntime()) {
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
      }
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
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await clearMustChangePassword(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to change password:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
