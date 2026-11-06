import "server-only";

import {
  getCaseStudies,
  replaceCaseStudiesCache,
  saveCaseStudy as saveMemory,
  deleteCaseStudy as deleteMemory,
  type CmsCaseStudy,
} from "@/lib/cms/repositories/case-studies-repository";
import { sanitizeLocalizedRichHtml } from "@/lib/cms/sanitize-rich-html.server";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import { readCmsDocumentChecked } from "@/lib/cms/server/strict-read";

export const CASE_STUDIES_DOC_ID = "case-studies";

function isStudies(value: unknown): value is CmsCaseStudy[] {
  return Array.isArray(value);
}

export async function readCaseStudiesDurable(): Promise<CmsCaseStudy[]> {
  const remote = await readCmsDocumentData(CASE_STUDIES_DOC_ID);
  if (isStudies(remote)) {
    replaceCaseStudiesCache(remote);
  }
  return getCaseStudies();
}

/** Save baseline: throws on a failed read; the cache changes only on success. */
export async function readCaseStudiesStrict(): Promise<CmsCaseStudy[]> {
  const remote = await readCmsDocumentChecked(CASE_STUDIES_DOC_ID, isStudies);
  if (remote) replaceCaseStudiesCache(remote);
  return getCaseStudies();
}

export async function saveCaseStudyDurable(
  study: CmsCaseStudy
): Promise<CmsCaseStudy> {
  await readCaseStudiesStrict();
  const saved = saveMemory({
    ...study,
    excerpt: sanitizeLocalizedRichHtml(study.excerpt),
    challenge: sanitizeLocalizedRichHtml(study.challenge),
    solution: sanitizeLocalizedRichHtml(study.solution),
    implementation: sanitizeLocalizedRichHtml(study.implementation),
    results: sanitizeLocalizedRichHtml(study.results),
    testimonial: {
      ...study.testimonial,
      quote: sanitizeLocalizedRichHtml(study.testimonial.quote),
    },
  });
  await writeCmsDocumentData(CASE_STUDIES_DOC_ID, "case-studies", getCaseStudies());
  return saved;
}

export async function deleteCaseStudyDurable(id: string): Promise<boolean> {
  await readCaseStudiesStrict();
  const ok = deleteMemory(id);
  if (ok) {
    await writeCmsDocumentData(
      CASE_STUDIES_DOC_ID,
      "case-studies",
      getCaseStudies()
    );
  }
  return ok;
}
