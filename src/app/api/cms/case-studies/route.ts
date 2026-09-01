import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";
import {
  deleteCaseStudyDurable,
  readCaseStudiesDurable,
  saveCaseStudyDurable,
} from "@/lib/cms/server/case-studies.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";
import { routing } from "@/i18n/routing";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
}

function revalidateCaseStudyPages(slug?: string) {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/case-studies`);
    if (slug) {
      revalidatePath(`/${locale}/case-studies/${slug}`);
    }
  }
  revalidatePath("/", "layout");
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readCaseStudiesDurable());
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as CmsCaseStudy;
  const saved = await saveCaseStudyDurable(body);
  revalidateCaseStudyPages(saved.slug);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const existing = (await readCaseStudiesDurable()).find((study) => study.id === id);
  await deleteCaseStudyDurable(id);
  revalidateCaseStudyPages(existing?.slug);
  return NextResponse.json({ ok: true });
}
