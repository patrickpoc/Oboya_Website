import { NextResponse } from "next/server";
import {
  getOrCreateProfileForAuthUser,
  updateOwnProfileDurable,
} from "@/lib/cms/server/users.server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCmsUsers } from "@/lib/cms/repositories/users-repository";
import type { CmsLocale } from "@/lib/cms/types";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      const user = getCmsUsers()[0];
      if (!user) {
        return NextResponse.json({ error: "No user" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, user });
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateProfileForAuthUser(
      authUser.id,
      authUser.email ?? ""
    );
    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const mustChange =
      authUser.user_metadata?.must_change_password === true ||
      user.mustChangePassword === true;

    return NextResponse.json({
      ok: true,
      user: { ...user, mustChangePassword: mustChange },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      name: string;
      jobTitle: string;
      locale: CmsLocale;
    }>;

    const user = await updateOwnProfileDurable({
      name: body.name?.trim(),
      jobTitle: body.jobTitle?.trim(),
      locale: body.locale,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
