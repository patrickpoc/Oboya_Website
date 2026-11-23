import "server-only";

import {
  DEFAULT_CONTACT_TEAM,
  normalizeContactTeam,
  type ContactPerson,
} from "@/lib/cms/repositories/contact-team-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import { readCmsDocumentChecked } from "@/lib/cms/server/strict-read";

export const CONTACT_TEAM_DOC_ID = "contact-team";

const isTeam = (value: unknown): value is ContactPerson[] => Array.isArray(value);

/** Stored team, or defaults when nothing is stored. */
export async function readContactTeamDurable(): Promise<ContactPerson[]> {
  const remote = await readCmsDocumentData(CONTACT_TEAM_DOC_ID);
  return isTeam(remote) ? normalizeContactTeam(remote) : DEFAULT_CONTACT_TEAM;
}

/** Save baseline: throws on a failed read. */
export async function readContactTeamStrict(): Promise<ContactPerson[]> {
  const remote = await readCmsDocumentChecked(CONTACT_TEAM_DOC_ID, isTeam);
  return remote ? normalizeContactTeam(remote) : DEFAULT_CONTACT_TEAM;
}

export async function saveContactTeamDurable(
  team: ContactPerson[]
): Promise<ContactPerson[]> {
  await readContactTeamStrict();
  const saved = normalizeContactTeam(team);
  await writeCmsDocumentData(CONTACT_TEAM_DOC_ID, "website", saved);
  return saved;
}
