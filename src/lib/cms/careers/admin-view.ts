import type { JobApplication } from "./types";

/** Admin API shape: drops public-apply internals (ip hash, CV ticket state). Keeps `extra.duplicateOf`. */
export function toAdminApplication<T extends Pick<JobApplication, "extra">>(app: T): T {
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(app.extra ?? {})) {
    if (key === "meta" || key.startsWith("cvTicket") || key.startsWith("cvPending")) continue;
    extra[key] = value;
  }
  return { ...app, extra };
}
