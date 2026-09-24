import { NextResponse } from "next/server";
import {
  addFormSubmissionDurable,
  anonymizeFormSubmissionDurable,
  deleteFormSubmissionDurable,
  readFormSubmissions,
  updateFormSubmissionStatusDurable,
} from "@/lib/cms/server/forms.server";
import type { FormSubmission, FormSubmissionStatus } from "@/lib/cms/types";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { isValidEmail } from "@/lib/security/email";
import { assertFormRateLimit } from "@/lib/security/rate-limit";
import { clientIpFromRequest, hashClientIp } from "@/lib/security/client-ip";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { PRIVACY_NOTICE_VERSION } from "@/lib/security/privacy-notice";
import { WORLD_COUNTRIES } from "@/lib/contact/world-countries";

const CONTACT_SUBJECT_MAX = 50;
const CONTACT_MESSAGE_MAX = 500;
const NAME_MAX = 80;
const PHONE_MAX = 32;
const STATUSES: FormSubmissionStatus[] = ["new", "read", "replied", "archived"];
const COUNTRY_CODES = new Set([
  ...WORLD_COUNTRIES.map((country) => country.code),
  "OTHER",
]);

export async function GET(request: Request) {
  const auth = await cmsGuard("forms", "view");
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as FormSubmission["type"] | null;
  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");
  const submissions = await readFormSubmissions(type ?? undefined);

  if (pageRaw !== null || limitRaw !== null) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitRaw) || 25));
    const start = (page - 1) * limit;
    const items = submissions.slice(start, start + limit);
    return NextResponse.json({
      items,
      total: submissions.length,
      page,
      limit,
    });
  }

  return NextResponse.json(submissions);
}

export async function PATCH(request: Request) {
  const auth = await cmsGuard("forms", "edit");
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      id?: string;
      status?: FormSubmissionStatus;
    };
    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updated = await updateFormSubmissionStatusDurable(
      body.id,
      body.status
    );
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
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
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const privacyAccepted = body.privacyAccepted === true;
    const marketingOptIn = body.marketingOptIn === true;

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
        subject,
        message,
        marketingOptIn,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        acceptedAt: new Date().toISOString(),
        meta: { ipHash },
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
