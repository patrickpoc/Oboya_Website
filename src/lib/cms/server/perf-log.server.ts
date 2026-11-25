import "server-only";

/** Structured duration logs for admin/CMS hot paths (Vercel log drain). */
export function logCmsPerf(
  label: string,
  startedAtMs: number,
  extra?: Record<string, unknown>
) {
  const ms = Date.now() - startedAtMs;
  console.info(
    JSON.stringify({
      type: "cms_perf",
      label,
      ms,
      ...extra,
    })
  );
  return ms;
}

/** One structured line per failed or timed-out CMS read (no row data, no secrets). */
export function logCmsReadFailure(
  label: string,
  startedAtMs: number,
  info: {
    source?: string;
    reason: "timeout" | "error";
    detail?: unknown;
  }
) {
  const ms = Date.now() - startedAtMs;
  const detail =
    info.detail instanceof Error ? info.detail.message : String(info.detail ?? "");
  console.error(
    JSON.stringify({
      type: "cms_read_error",
      label,
      source: info.source,
      reason: info.reason,
      ms,
      detail: detail.slice(0, 200),
    })
  );
  return ms;
}
