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
import {
  pendingApprovalResponse,
  stripApprovalMeta,
  submitOrApply,
} from "@/lib/cms/server/approvals.server";
import { diffJson, summarizeDiff } from "@/lib/cms/approvals/diff";

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

async function findStudy(id: string) {
  return (await readCaseStudiesDurable()).find((study) => study.id === id) ?? null;
}

function studyLabel(study: Pick<CmsCaseStudy, "title" | "slug"> | null, id: string) {
  return study?.title?.en || study?.title?.["pt-BR"] || study?.slug || id;
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
  const body = stripApprovalMeta((await request.json()) as CmsCaseStudy);
  const gate = await submitOrApply({
    user: auth.user,
    changeType: "case_studies.upsert",
    entityId: body.id,
    entityLabel: studyLabel(body, body.id),
    action: "update",
    payload: body,
    loadSnapshot: () => findStudy(body.id),
    diff: (before) => ({ entries: diffJson(before, body) }),
    summary: (d) => summarizeDiff(d.entries),
    apply: async () => {
      const saved = await saveCaseStudyDurable(body);
      revalidateCaseStudyPages(saved.slug);
      return saved;
    },
  });
  if (!gate.applied) return pendingApprovalResponse(gate.request, body);
  return NextResponse.json(gate.result, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("case_studies", "delete");
  if ("response" in auth) return auth.response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const existing = await findStudy(id);
  const gate = await submitOrApply({
    user: auth.user,
    changeType: "case_studies.delete",
    entityId: id,
    entityLabel: studyLabel(existing, id),
    action: "delete",
    payload: { id },
    snapshot: existing,
    diff: { entries: [{ path: "(delete)", before: existing?.slug ?? id, after: null }] },
    summary: `Delete case study ${studyLabel(existing, id)}`,
    apply: async () => {
      await deleteCaseStudyDurable(id);
      revalidateCaseStudyPages(existing?.slug);
    },
  });
  if (!gate.applied) return pendingApprovalResponse(gate.request, { ok: false });
  return NextResponse.json({ ok: true });
}
