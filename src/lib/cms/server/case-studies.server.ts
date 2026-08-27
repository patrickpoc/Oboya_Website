import "server-only";

import {
  getCaseStudies,
  replaceCaseStudiesCache,
  saveCaseStudy as saveMemory,
  deleteCaseStudy as deleteMemory,
  type CmsCaseStudy,
} from "@/lib/cms/repositories/case-studies-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

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

export async function saveCaseStudyDurable(
  study: CmsCaseStudy
): Promise<CmsCaseStudy> {
  await readCaseStudiesDurable();
  const saved = saveMemory(study);
  await writeCmsDocumentData(CASE_STUDIES_DOC_ID, "case-studies", getCaseStudies());
  return saved;
}

export async function deleteCaseStudyDurable(id: string): Promise<boolean> {
  await readCaseStudiesDurable();
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
