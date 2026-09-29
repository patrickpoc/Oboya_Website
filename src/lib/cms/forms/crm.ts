import {
  FORM_PRIORITIES,
  FORM_SUBMISSION_STATUSES,
  type FormPriority,
  type FormSubmission,
  type FormSubmissionStatus,
} from "@/lib/cms/types";

/** Hours a new lead may wait before it counts as late (first response SLA). */
export const LEAD_SLA_WARNING_HOURS = 24;
export const LEAD_SLA_OVERDUE_HOURS = 48;

/** Statuses that still need someone to act on the lead. */
export const OPEN_LEAD_STATUSES: FormSubmissionStatus[] = ["new", "in_progress"];

export function normalizeSubmissionStatus(raw: unknown): FormSubmissionStatus {
  const value = String(raw ?? "").trim();
  if (value === "read") return "in_progress";
  return (FORM_SUBMISSION_STATUSES as readonly string[]).includes(value)
    ? (value as FormSubmissionStatus)
    : "new";
}

export function isSubmissionStatus(raw: unknown): raw is FormSubmissionStatus {
  return (FORM_SUBMISSION_STATUSES as readonly string[]).includes(String(raw));
}

export function normalizePriority(raw: unknown): FormPriority {
  return (FORM_PRIORITIES as readonly string[]).includes(String(raw))
    ? (raw as FormPriority)
    : "normal";
}

export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const tag of raw) {
    const value = String(tag ?? "").trim().toLowerCase().slice(0, 40);
    if (value) seen.add(value);
  }
  return [...seen].slice(0, 20);
}

/** Legacy rows have no read_at: anything past "new" was already opened. */
export function isUnread(submission: FormSubmission): boolean {
  if (submission.readAt) return false;
  return submission.status === "new";
}

export type SlaState = "ok" | "warning" | "overdue";

export function leadSlaState(submission: FormSubmission, now = Date.now()): SlaState {
  if (submission.status !== "new") return "ok";
  const ageHours = (now - new Date(submission.createdAt).getTime()) / 36e5;
  if (ageHours >= LEAD_SLA_OVERDUE_HOURS) return "overdue";
  if (ageHours >= LEAD_SLA_WARNING_HOURS) return "warning";
  return "ok";
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function leadEmail(submission: FormSubmission): string {
  return str(submission.data.email).toLowerCase();
}

export function leadName(submission: FormSubmission): string {
  const d = submission.data;
  const full = [str(d.firstName), str(d.lastName)].filter(Boolean).join(" ");
  return full || str(d.contactName) || str(d.name) || str(d.company) || leadEmail(submission);
}

export function leadCompany(submission: FormSubmission): string {
  return str(submission.data.company);
}

export function leadCountry(submission: FormSubmission): string {
  return str(submission.data.countryName) || str(submission.data.country);
}

export function isRedacted(submission: FormSubmission): boolean {
  return submission.data.redacted === true;
}

/** Keeps the domain readable while hiding most of the local part. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email ? `${email.slice(0, 1)}•••` : "";
  return `${local.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(local.length - 2, 5)))}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\s+/g, " ").trim();
  if (digits.length <= 4) return "••••";
  return `${digits.slice(0, 3)} ••• ${digits.slice(-2)}`;
}

export type LeadFilters = {
  status?: string;
  assignee?: string;
  tag?: string;
  from?: string;
  to?: string;
  q?: string;
};

export function matchesLeadFilters(submission: FormSubmission, filters: LeadFilters): boolean {
  if (filters.status) {
    if (filters.status === "open") {
      if (!OPEN_LEAD_STATUSES.includes(submission.status)) return false;
    } else if (filters.status === "unread") {
      if (!isUnread(submission)) return false;
    } else if (submission.status !== filters.status) return false;
  }
  if (filters.assignee) {
    if (filters.assignee === "none") {
      if (submission.assigneeId) return false;
    } else if (submission.assigneeId !== filters.assignee) return false;
  }
  if (filters.tag && !(submission.tags ?? []).includes(filters.tag)) return false;
  if (filters.from && submission.createdAt < filters.from) return false;
  if (filters.to && submission.createdAt.slice(0, 10) > filters.to.slice(0, 10)) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [
      leadName(submission),
      leadEmail(submission),
      leadCompany(submission),
      str(submission.data.subject),
      str(submission.data.message),
      str(submission.data.referenceId),
      ...(submission.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function submissionsToCsv(
  rows: FormSubmission[],
  options?: { maskPii?: boolean }
): string {
  const mask = options?.maskPii ?? false;
  const header = [
    "id",
    "type",
    "status",
    "createdAt",
    "name",
    "email",
    "company",
    "country",
    "priority",
    "assignee",
    "tags",
    "subject",
    "message",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    const email = leadEmail(row);
    lines.push(
      [
        csvCell(row.id),
        csvCell(row.type),
        csvCell(row.status),
        csvCell(row.createdAt),
        csvCell(leadName(row)),
        csvCell(mask ? maskEmail(email) : email),
        csvCell(leadCompany(row)),
        csvCell(leadCountry(row)),
        csvCell(row.priority ?? "normal"),
        csvCell(row.assigneeName ?? ""),
        csvCell((row.tags ?? []).join("|")),
        csvCell(str(row.data.subject) || str(row.data.referenceId)),
        csvCell(mask ? "" : str(row.data.message)),
      ].join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

export function countByStatus(submissions: FormSubmission[]) {
  const counts: Record<FormSubmissionStatus | "open" | "unread" | "all", number> = {
    all: submissions.length,
    open: 0,
    unread: 0,
    new: 0,
    in_progress: 0,
    replied: 0,
    converted: 0,
    archived: 0,
    spam: 0,
  };
  for (const s of submissions) {
    counts[s.status] += 1;
    if (OPEN_LEAD_STATUSES.includes(s.status)) counts.open += 1;
    if (isUnread(s)) counts.unread += 1;
  }
  return counts;
}
