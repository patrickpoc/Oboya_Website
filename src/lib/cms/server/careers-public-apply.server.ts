import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { PUBLIC_APPLY_LIMITS, type PublicApplicationValue } from "@/lib/cms/careers/public-apply";
import type { JobApplication } from "@/lib/cms/careers/types";
import {
  attachPublicCv,
  consumeCvTicket,
  findRecentDuplicate,
  getApplication,
  insertPublicApplication,
  patchApplicationExtra,
} from "@/lib/cms/server/careers-applications.server";
import { CareersError, withTimeout } from "@/lib/cms/server/careers-core.server";
import { createCvUploadUrl, verifyCvObject } from "@/lib/cms/server/careers-cv.server";
import { isOpeningIdPublicLive } from "@/lib/cms/server/careers-public.server";
import { CAREERS_PRIVACY_NOTICE_VERSION } from "@/lib/security/privacy-notice";

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

const PENDING_KEYS = ["cvPending", "cvPendingPath", "cvTicketHash", "cvTicketExp", "cvName"] as const;
const sha256 = (value: string) => createHash("sha256").update(value).digest();

/** Creates the row (source website, no actor) and the signed CV upload URL. Opening must already be verified public. */
export async function createPublicApplication(
  parsed: PublicApplicationValue,
  ctx: { openingId: string | null; ipHash: string }
) {
  const id = randomUUID();
  const now = new Date();
  // Duplicates are accepted and flagged for the recruiter, never rejected.
  const duplicateOf = await findRecentDuplicate(parsed.application.email, ctx.openingId, DEDUPE_WINDOW_MS);
  // Upload URL first: if storage is down no PII row is left behind.
  const upload = await createCvUploadUrl({ applicationId: id, mime: parsed.cv.mime, size: parsed.cv.size });
  const ticket = randomBytes(32).toString("base64url");
  const app: JobApplication = {
    ...parsed.application,
    id,
    openingId: ctx.openingId,
    source: "website",
    status: "new",
    tags: [],
    locale: parsed.locale,
    consentPrivacy: true,
    consentPrivacyAt: now.toISOString(),
    consentVersion: CAREERS_PRIVACY_NOTICE_VERSION,
    createdBy: undefined,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
    extra: {
      meta: { ipHash: ctx.ipHash },
      ...(duplicateOf ? { duplicateOf } : {}),
      cvPending: true,
      cvPendingPath: upload.path,
      cvName: parsed.cv.name.replace(/[\x00-\x1f\\/]/g, "_"),
      cvTicketHash: sha256(ticket).toString("hex"),
      cvTicketExp: now.getTime() + PUBLIC_APPLY_LIMITS.ticketTtlMs,
    },
  };
  await insertPublicApplication(app);
  return { applicationId: id, uploadUrl: upload.signedUrl, path: upload.path, ticket };
}

const invalidTicket = () => new CareersError(400, "invalidTicket");

/**
 * Single-use ticket. Order: validate, consume the ticket atomically (conditional update on id + ticket hash),
 * then verify the stored CV. If verification fails the pending state is restored (same ticket and path, until
 * its original expiry) so the client can re-upload to the same signed URL and call confirm again.
 */
export async function confirmPublicCv(input: { applicationId: string; path: string; ticket: string }) {
  const app = await withTimeout(getApplication(input.applicationId));
  const extra = (app?.extra ?? {}) as Record<string, unknown>;
  const hash = typeof extra.cvTicketHash === "string" ? extra.cvTicketHash : "";
  const exp = Number(extra.cvTicketExp);
  if (!app || app.source !== "website" || extra.cvPending !== true || !hash) throw invalidTicket();

  const given = sha256(input.ticket);
  const stored = Buffer.from(hash, "hex");
  if (stored.length !== given.length || !timingSafeEqual(stored, given)) throw invalidTicket();
  if (!Number.isFinite(exp) || Date.now() > exp) throw invalidTicket();
  if (input.path !== extra.cvPendingPath) throw invalidTicket();

  if (app.openingId && !(await withTimeout(isOpeningIdPublicLive(app.openingId)))) throw new CareersError(404, "openingClosed");

  const consumed = { ...extra };
  delete consumed.cvTicketHash;
  delete consumed.cvTicketExp;
  if (!(await withTimeout(consumeCvTicket(app.id, hash, consumed)))) throw invalidTicket();

  const rest = { ...extra };
  for (const key of PENDING_KEYS) delete rest[key];
  try {
    const verified = await withTimeout(verifyCvObject(app.id, input.path), 25_000);
    // One write sets the CV columns and clears cvPending*/cvTicket*; a later activity failure is only logged.
    await withTimeout(
      attachPublicCv(
        app.id,
        { path: input.path, filename: String(extra.cvName ?? "cv").slice(0, 255), mime: verified.mime, size: verified.size },
        rest
      )
    );
  } catch (error) {
    // Restore only while no ticket hash is stored, so a concurrent state is never overwritten.
    await withTimeout(patchApplicationExtra(app.id, extra, { ifNoTicket: true }), 10_000).catch(() => undefined);
    throw error;
  }
}
