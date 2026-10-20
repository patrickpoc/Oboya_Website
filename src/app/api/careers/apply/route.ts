import { NextResponse } from "next/server";
import { looksLikeBot, parsePublicApplication, PUBLIC_APPLY_LIMITS } from "@/lib/cms/careers/public-apply";
import { CareersError, careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { getPublicOpeningLive } from "@/lib/cms/server/careers-public.server";
import { createPublicApplication } from "@/lib/cms/server/careers-public-apply.server";
import { clientIpFromRequest, hashClientIpKeyed } from "@/lib/security/client-ip";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { isSameOrigin, readBoundedJson } from "@/lib/security/public-request";
import { assertCareersApplyRateLimit } from "@/lib/security/rate-limit";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStoreHeaders });

export async function POST(request: Request) {
  if (isSupabaseConfigured() && !isServiceRoleConfigured()) return fail("unavailable", 503);
  if (!isSameOrigin(request)) return fail("forbidden", 403);

  try {
    const read = await readBoundedJson(request, PUBLIC_APPLY_LIMITS.bodyBytes);
    if (!read.ok) return fail(read.status === 413 ? "payloadTooLarge" : "invalidBody", read.status);

    // Bots get a success-looking reply and nothing is written.
    if (looksLikeBot(read.body)) return NextResponse.json({ ok: true }, { headers: noStoreHeaders });

    const parsed = parsePublicApplication(read.body);
    if (!parsed.ok) return fail("validation", 400, { fields: parsed.errors });
    const { value } = parsed;

    let ipHash: string;
    try {
      ipHash = hashClientIpKeyed(clientIpFromRequest(request));
    } catch {
      return fail("unavailable", 503);
    }
    const limited = await assertCareersApplyRateLimit({ email: value.application.email, ipHash });
    if (!limited.ok) return fail("rateLimited", 429);

    let openingId: string | null = null;
    if (value.openingSlug) {
      const opening = await getPublicOpeningLive(value.openingSlug);
      if (!opening) return fail("openingClosed", 404);
      openingId = opening.id;
    }

    const created = await createPublicApplication(value, { openingId, ipHash });
    return NextResponse.json(created, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof CareersError && error.status === 503) return fail("unavailable", 503);
    return careersErrorResponse(error, "applyFailed");
  }
}
