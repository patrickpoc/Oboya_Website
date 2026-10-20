import { NextResponse } from "next/server";
import { CareersError, UUID_RE, careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { confirmPublicCv } from "@/lib/cms/server/careers-public-apply.server";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { isSameOrigin, readBoundedJson } from "@/lib/security/public-request";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BODY_MAX = 2 * 1024;
const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: noStoreHeaders });

export async function POST(request: Request) {
  if (isSupabaseConfigured() && !isServiceRoleConfigured()) return fail("unavailable", 503);
  if (!isSameOrigin(request)) return fail("forbidden", 403);

  try {
    const read = await readBoundedJson(request, BODY_MAX);
    if (!read.ok) return fail(read.status === 413 ? "payloadTooLarge" : "invalidBody", read.status);
    const body = (read.body && typeof read.body === "object" ? read.body : {}) as Record<string, unknown>;
    const { applicationId, path, ticket } = body;
    if (
      typeof applicationId !== "string" || !UUID_RE.test(applicationId) ||
      typeof path !== "string" || path.length > 200 ||
      typeof ticket !== "string" || ticket.length < 20 || ticket.length > 100
    ) {
      return fail("invalidTicket", 400);
    }
    await confirmPublicCv({ applicationId, path, ticket });
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof CareersError && error.status === 503) return fail("unavailable", 503);
    // Public vocabulary: the storage check reports `tooLarge`, the form expects `cvTooLarge`.
    if (error instanceof CareersError && error.code === "tooLarge") return fail("cvTooLarge", 400);
    return careersErrorResponse(error, "confirmFailed");
  }
}
