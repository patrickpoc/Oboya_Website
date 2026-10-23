import type { JobApplication } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const PENDING_CV_TTL_MS = DAY_MS;
export const RETENTION_DAYS = 365;
export const TALENT_POOL_RETENTION_DAYS = 730;

/** Website row whose CV was never confirmed and is older than 24 h: delete it. */
export function isExpiredPending(app: JobApplication, now: number): boolean {
  return (
    app.source === "website" &&
    !app.cvPath &&
    (app.extra as { cvPending?: unknown } | undefined)?.cvPending === true &&
    now - Date.parse(app.createdAt ?? "") > PENDING_CV_TTL_MS
  );
}

/** Older than 12 months (24 with talent-pool consent) and not yet anonymized. */
export function isRetentionExpired(app: JobApplication, now: number): boolean {
  if (app.anonymizedAt) return false;
  const days = app.consentTalentPool ? TALENT_POOL_RETENTION_DAYS : RETENTION_DAYS;
  const created = Date.parse(app.createdAt ?? "");
  return Number.isFinite(created) && now - created > days * DAY_MS;
}
