import { NextResponse } from "next/server";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";
import {
  deleteCaseStudyDurable,
  readCaseStudiesDurable,
  saveCaseStudyDurable,
} from "@/lib/cms/server/case-studies.server";
import { revalidateCaseStudyPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import type { LocalizedString } from "@/lib/cms/types";

const EMPTY_LOCALIZED: LocalizedString = {
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
};

function toListStudy(study: CmsCaseStudy): CmsCaseStudy {
  return {
    ...study,
    challenge: EMPTY_LOCALIZED,
    solution: EMPTY_LOCALIZED,
    implementation: EMPTY_LOCALIZED,
    results: EMPTY_LOCALIZED,
    testimonial: {
      ...study.testimonial,
      quote: EMPTY_LOCALIZED,
    },
  };
}

export async function GET(request: Request) {
  const auth = await cmsGuard("case_studies", "view");
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const fields = url.searchParams.get("fields");
  const studies = await readCaseStudiesDurable();

  if (id) {
    const study = studies.find((item) => item.id === id);
    if (!study) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(study);
  }

  if (fields === "list") {
    return NextResponse.json(studies.map(toListStudy));
  }

  return NextResponse.json(studies);
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
