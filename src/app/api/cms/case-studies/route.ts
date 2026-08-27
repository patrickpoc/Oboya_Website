import { NextResponse } from "next/server";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";
import {
  deleteCaseStudyDurable,
  readCaseStudiesDurable,
  saveCaseStudyDurable,
} from "@/lib/cms/server/case-studies.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
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
  await deleteCaseStudyDurable(id);
  return NextResponse.json({ ok: true });
}
