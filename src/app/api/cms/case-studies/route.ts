import { NextResponse } from "next/server";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";
import {
  deleteCaseStudyDurable,
  readCaseStudiesDurable,
  saveCaseStudyDurable,
} from "@/lib/cms/server/case-studies.server";
import { revalidateCaseStudyPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  const auth = await cmsGuard("case_studies", "view");
  if ("response" in auth) return auth.response;
  return NextResponse.json(await readCaseStudiesDurable());
}

export async function POST(request: Request) {
  const auth = await cmsGuard("case_studies", "edit");
  if ("response" in auth) return auth.response;
  const body = (await request.json()) as CmsCaseStudy;
  const saved = await saveCaseStudyDurable(body);
  revalidateCaseStudyPages(saved.slug);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("case_studies", "delete");
  if ("response" in auth) return auth.response;
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
