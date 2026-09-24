/** URL-safe slug: lowercase, ASCII-ish, hyphens only. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);
}

/** Calendar date → start of that day in UTC (00:00:00.000Z). */
export function publishedDateToIso(dateYmd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim());
  if (!match) return new Date().toISOString();
  return `${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`;
}

export function isoToDateInput(iso: string | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
