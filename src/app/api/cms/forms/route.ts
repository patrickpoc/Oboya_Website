import { NextResponse } from "next/server";
import {
  addFormSubmissionDurable,
  anonymizeFormSubmissionDurable,
  deleteFormSubmissionDurable,
  logFormActivities,
  mergeFormSubmissions,
  readFormSubmissionById,
  readFormSubmissions,
  readSubmissionsByEmail,
} from "@/lib/cms/server/forms.server";
import { applyFormPatch, parseFormPatch } from "@/lib/cms/server/form-patch.server";
import type { FormSubmission } from "@/lib/cms/types";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { isValidEmail } from "@/lib/security/email";
import { assertFormRateLimit } from "@/lib/security/rate-limit";
import { clientIpFromRequest, hashClientIp } from "@/lib/security/client-ip";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { PRIVACY_NOTICE_VERSION } from "@/lib/security/privacy-notice";
import { WORLD_COUNTRIES } from "@/lib/contact/world-countries";
import { sanitizeLeadContext } from "@/lib/forms/lead-context";
import { leadEmail, matchesLeadFilters } from "@/lib/cms/forms/crm";
import { noStoreHeaders } from "@/lib/security/http-cache";

const CONTACT_SUBJECT_MAX = 50;
const CONTACT_MESSAGE_MAX = 500;
const NAME_MAX = 80;
const PHONE_MAX = 32;
const COMPANY_MAX = 120;
const COUNTRY_CODES = new Set([
  ...WORLD_COUNTRIES.map((country) => country.code),
  "OTHER",
]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await cmsGuard("forms", "view");
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const item = await readFormSubmissionById(id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const related = leadEmail(item)
      ? await readSubmissionsByEmail(leadEmail(item), item.id)
      : [];
    return NextResponse.json({ item, related }, { headers: noStoreHeaders });
  }

  const type = searchParams.get("type") as FormSubmission["type"] | null;
  const submissions = await readFormSubmissions(type ?? undefined);
  const filtered = submissions.filter((row) =>
    matchesLeadFilters(row, {
      status: searchParams.get("status") ?? undefined,
      assignee: searchParams.get("assignee") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    })
  );

  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");
  if (pageRaw !== null || limitRaw !== null) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitRaw) || 25));
    const start = (page - 1) * limit;
    return NextResponse.json(
      {
        items: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
      },
      { headers: noStoreHeaders }
    );
  }

  return NextResponse.json(filtered, { headers: noStoreHeaders });
}

export async function PATCH(request: Request) {
  const auth = await cmsGuard("forms", "edit");
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (Array.isArray(body.mergeInto) || body.mergeInto) {
      const primaryId = String(body.id ?? "");
      const duplicates = Array.isArray(body.mergeInto)
        ? body.mergeInto.map(String)
        : [];
      if (!primaryId || duplicates.length === 0) {
        return NextResponse.json({ error: "id and mergeInto are required" }, { status: 400 });
      }
      const item = await mergeFormSubmissions(primaryId, duplicates, {
        id: auth.user.id,
        name: auth.user.name,
      });
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ item });
    }

    const ids = Array.isArray(body.ids)
      ? body.ids.map(String)
      : body.id
        ? [String(body.id)]
        : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "id or ids is required" }, { status: 400 });
    }
    const patch = parseFormPatch(body);
    if (!patch) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const current = await readFormSubmissions();
    const updated = await applyFormPatch(ids, patch, { id: auth.user.id, name: auth.user.name }, current);
    if (updated.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(ids.length === 1 ? updated[0] : { items: updated });
  } catch (error) {
    console.error("Failed to update submission:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("forms", "delete");
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const anonymize = searchParams.get("anonymize") === "1";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    if (anonymize) {
      const updated = await anonymizeFormSubmissionDurable(id);
      if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await logFormActivities([
        { submissionId: id, kind: "pii", meta: { action: "anonymize" }, actor: { id: auth.user.id, name: auth.user.name } },
      ]);
      return NextResponse.json(updated);
    }
    await deleteFormSubmissionDurable(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (isSupabaseConfigured() && !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = body.type;

    if (type !== "contact") {
      return NextResponse.json(
        { error: "Unsupported form type" },
        { status: 400 }
      );
    }

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const countryCode = String(body.countryCode ?? "").trim();
    const countryName = String(body.countryName ?? "").trim();
    const company = String(body.company ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const privacyAccepted = body.privacyAccepted === true;
    const marketingOptIn = body.marketingOptIn === true;
    const context = sanitizeLeadContext(body.context);

    if (!firstName || !lastName || !email || !countryCode || !subject || !message) {
      return NextResponse.json(
        {
          error:
            "First name, last name, email, country, subject and message are required",
        },
        { status: 400 }
      );
    }

    if (!privacyAccepted) {
      return NextResponse.json(
        { error: "Privacy notice must be acknowledged" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (firstName.length > NAME_MAX || lastName.length > NAME_MAX) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }
    if (phone.length > PHONE_MAX) {
      return NextResponse.json({ error: "Phone is too long" }, { status: 400 });
    }
    if (company.length > COMPANY_MAX) {
      return NextResponse.json({ error: "Company is too long" }, { status: 400 });
    }
    if (!COUNTRY_CODES.has(countryCode)) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    }
    if (subject.length > CONTACT_SUBJECT_MAX) {
      return NextResponse.json(
        { error: `Subject must be at most ${CONTACT_SUBJECT_MAX} characters` },
        { status: 400 }
      );
    }
    if (message.length > CONTACT_MESSAGE_MAX) {
      return NextResponse.json(
        { error: `Message must be at most ${CONTACT_MESSAGE_MAX} characters` },
        { status: 400 }
      );
    }

    const ipHash = hashClientIp(clientIpFromRequest(request));
    const limited = await assertFormRateLimit({ email, ipHash });
    if (!limited.ok) {
      return NextResponse.json({ error: limited.error }, { status: 429 });
    }

    const submission = await addFormSubmissionDurable({
      type: "contact",
      status: "new",
      data: {
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        countryName: countryName || countryCode,
        ...(company ? { company } : {}),
        subject,
        message,
        marketingOptIn,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        acceptedAt: new Date().toISOString(),
        meta: { ipHash, ...context },
      },
    });

    return NextResponse.json({ ok: true, id: submission.id });
  } catch (error) {
    console.error("Failed to process contact submission:", error);
    return NextResponse.json(
      { error: "Failed to process contact submission" },
      { status: 500 }
    );
  }
}
