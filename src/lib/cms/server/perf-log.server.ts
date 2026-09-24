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
