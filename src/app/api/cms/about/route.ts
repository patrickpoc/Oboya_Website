import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import {
  readAboutPageSettingsDurable,
  saveAboutPageSettingsDurable,
} from "@/lib/cms/server/about-page.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

const LOCALES = ["en", "pt-BR", "es", "zh-CN"] as const;

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
}

export async function GET() {
  return NextResponse.json(await readAboutPageSettingsDurable());
}

export async function PUT(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AboutPageSettings;
    const saved = await saveAboutPageSettingsDurable(body);

    // Bust ISR/cache so /about and /about-v2 pick up live cms_documents.
    revalidatePath("/", "layout");
    for (const locale of LOCALES) {
      revalidatePath(`/${locale}/about`);
      revalidatePath(`/${locale}/about-v2`);
    }

    return NextResponse.json(saved);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save about settings";
    console.error("About save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
