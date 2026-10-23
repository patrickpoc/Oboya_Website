import { csvCell } from "@/lib/cms/forms/crm";
import {
  PIPELINE_STATUSES,
  type ApplicationFilters,
  type JobApplication,
  type JobOpening,
  type OpeningFilters,
  type PipelineCounts,
} from "./types";

function includesQuery(haystack: Array<string | undefined>, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((value) => value?.toLowerCase().includes(needle));
}

export function matchesOpeningFilters(opening: JobOpening, filters: OpeningFilters): boolean {
  const status = filters.status ?? "active";
  if (status === "active") {
    if (opening.status === "archived") return false;
  } else if (status !== "all" && opening.status !== status) {
    return false;
  }
  if (filters.department && opening.department !== filters.department) return false;
  if (filters.countryCode && opening.countryCode !== filters.countryCode) return false;
  if (filters.workModel && opening.workModel !== filters.workModel) return false;
  if (filters.q) {
    return includesQuery(
      [
        ...Object.values(opening.title),
        opening.slug,
        opening.department,
        opening.city,
        opening.recruiterName,
        opening.hiringManagerName,
      ],
      filters.q
    );
  }
  return true;
}

export function matchesApplicationFilters(app: JobApplication, filters: ApplicationFilters): boolean {
  if (filters.openingId === "talent_pool") {
    if (app.openingId) return false;
  } else if (filters.openingId && app.openingId !== filters.openingId) {
    return false;
  }
  if (filters.status && app.status !== filters.status) return false;
  if (filters.source && app.source !== filters.source) return false;
  if (filters.q) {
    return includesQuery([app.fullName, app.email, app.currentCompany, app.currentTitle], filters.q);
  }
  return true;
}

export function countByPipelineStatus(apps: Array<Pick<JobApplication, "status">>): PipelineCounts {
  const counts = { total: 0 } as PipelineCounts;
  for (const status of PIPELINE_STATUSES) counts[status] = 0;
  for (const app of apps) {
    if (app.status in counts) counts[app.status] += 1;
    counts.total += 1;
  }
  return counts;
}

/** Spreadsheet formula injection guard for cells that start (after whitespace) with = + - @ or tab/CR. */
export function safeCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return csvCell(/^[\t\r]/.test(text) || /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text);
}

export function applicationsToCsv(
  rows: JobApplication[],
  openingTitles: Record<string, string> = {}
): string {
  const header = [
    "id",
    "createdAt",
    "opening",
    "status",
    "rating",
    "source",
    "fullName",
    "email",
    "phone",
    "country",
    "city",
    "currentCompany",
    "currentTitle",
    "yearsExperience",
    "assignee",
    "tags",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.createdAt,
        row.openingId ? (openingTitles[row.openingId] ?? row.openingId) : "",
        row.status,
        row.rating,
        row.source,
        row.fullName,
        row.email,
        row.phone,
        row.countryCode,
        row.city,
        row.currentCompany,
        row.currentTitle,
        row.yearsExperience,
        row.assigneeName,
        row.tags.join("|"),
      ]
        .map(safeCell)
        .join(",")
    );
  }
  return lines.join("\n");
}
