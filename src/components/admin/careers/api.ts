import type { OpeningAction } from "@/lib/cms/careers/lifecycle";
import type {
  ApplicationFilters,
  JobApplication,
  JobApplicationActivity,
  JobOpening,
  JobOpeningWithStats,
  OpeningFilters,
} from "@/lib/cms/careers/types";

const BASE = "/api/cms/careers";

/** Carries the stable `{error}` code returned by the careers API. */
export class CareersApiError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(code);
  }
}

export type CareersWriteResult<T> = { item: T; pendingApproval?: unknown; payload: unknown };

async function call(url: string, init?: RequestInit): Promise<{ data: unknown; status: number }> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const code = (data as { error?: string } | null)?.error;
    throw new CareersApiError(code ?? "request_failed", res.status);
  }
  return { data, status: res.status };
}

const post = (path: string, body: unknown) =>
  call(`${BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export async function listOpenings(filters: OpeningFilters = {}): Promise<JobOpeningWithStats[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.department) params.set("department", filters.department);
  if (filters.countryCode) params.set("country", filters.countryCode);
  if (filters.workModel) params.set("workModel", filters.workModel);
  const { data } = await call(`${BASE}/openings?${params}`);
  return (data as { items: JobOpeningWithStats[] }).items;
}

export async function getOpening(id: string): Promise<JobOpening> {
  const { data } = await call(`${BASE}/openings/${encodeURIComponent(id)}`);
  return (data as { item: JobOpening }).item;
}

export async function saveOpening(opening: JobOpening): Promise<CareersWriteResult<JobOpening>> {
  const { data } = await post("openings", { action: "upsert", opening });
  return { item: (data as { item: JobOpening }).item, payload: data };
}

export async function runOpeningAction(
  action: OpeningAction | "duplicate",
  id: string
): Promise<CareersWriteResult<JobOpening>> {
  const { data } = await post("openings", { action, id });
  return { item: (data as { item: JobOpening }).item, payload: data };
}

/** Resolves `{ blocked: true }` on 409 hasApplications so callers can suggest archiving. */
export async function deleteOpening(id: string): Promise<{ blocked: boolean; payload: unknown }> {
  try {
    const { data } = await call(`${BASE}/openings?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    return { blocked: false, payload: data };
  } catch (error) {
    if (error instanceof CareersApiError && error.code === "hasApplications") {
      return { blocked: true, payload: null };
    }
    throw error;
  }
}

function applicationParams(filters: ApplicationFilters): string {
  const params = new URLSearchParams();
  if (filters.openingId) params.set("opening", filters.openingId);
  if (filters.status) params.set("status", filters.status);
  if (filters.source) params.set("source", filters.source);
  if (filters.q) params.set("q", filters.q);
  return params.toString();
}

const appUrl = (id: string, suffix = "") => `${BASE}/applications/${encodeURIComponent(id)}${suffix}`;
const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const item = async (p: Promise<{ data: unknown }>) => ((await p).data as { item: JobApplication }).item;

export async function listApplications(filters: ApplicationFilters = {}): Promise<JobApplication[]> {
  const { data } = await call(`${BASE}/applications?${applicationParams(filters)}`);
  return (data as { items: JobApplication[] }).items;
}

export const applicationsExportUrl = (filters: ApplicationFilters) =>
  `${BASE}/applications/export?${applicationParams(filters)}`;

export const getApplication = (id: string) => item(call(appUrl(id)));

export const updateApplication = (id: string, patch: Partial<JobApplication>) =>
  item(call(appUrl(id), json("PATCH", patch)));

export const markApplicationRead = (id: string) => item(call(appUrl(id), json("PATCH", { markRead: true })));

export async function deleteApplication(id: string): Promise<void> {
  await call(appUrl(id), { method: "DELETE" });
}

export const anonymizeApplication = (id: string) => item(call(appUrl(id), json("POST", { action: "anonymize" })));

export async function listActivities(id: string): Promise<JobApplicationActivity[]> {
  const { data } = await call(appUrl(id, "/activities"));
  return (data as { activities: JobApplicationActivity[] }).activities;
}

export async function addNote(id: string, body: string): Promise<JobApplicationActivity> {
  const { data } = await call(appUrl(id, "/activities"), json("POST", { body }));
  return (data as { activity: JobApplicationActivity }).activity;
}

/** Signed upload -> PUT to storage -> confirm. Throws CareersApiError with a stable code. */
export async function uploadCv(id: string, file: File): Promise<JobApplication> {
  const mime = file.type.toLowerCase();
  const { data } = await call(appUrl(id, "/cv"), json("POST", { mime, size: file.size }));
  const { path, signedUrl } = data as { path: string; signedUrl: string };
  const put = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": mime }, body: file });
  if (!put.ok) throw new CareersApiError("uploadFailed", put.status);
  return item(call(appUrl(id, "/cv"), json("PUT", { path, filename: file.name })));
}

export async function getCvUrl(id: string): Promise<string> {
  const { data } = await call(appUrl(id, "/cv"));
  return (data as { url: string }).url;
}

export const removeCv = (id: string) => item(call(appUrl(id, "/cv"), { method: "DELETE" }));
