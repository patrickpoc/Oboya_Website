import { NextResponse } from "next/server";
import {
  addFormSubmission,
  getFormSubmissions,
} from "@/lib/cms/repositories/forms-repository";
import type { FormSubmission } from "@/lib/cms/types";

const CONTACT_SUBJECTS = new Set([
  "general",
  "products",
  "partnership",
  "support",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as FormSubmission["type"] | null;

  const submissions = getFormSubmissions(type ?? undefined);
  return NextResponse.json(submissions);
}

export async function POST(request: Request) {
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

    if (!firstName || !lastName || !email || !countryCode || !message) {
      return NextResponse.json(
        {
          error:
            "First name, last name, email, country and message are required",
        },
        { status: 400 }
      );
    }

    if (!CONTACT_SUBJECTS.has(subject)) {
      return NextResponse.json(
        { error: "Invalid subject" },
        { status: 400 }
      );
    }

    const submission = addFormSubmission({
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
      },
    });

    return NextResponse.json({ ok: true, id: submission.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to process contact submission" },
      { status: 500 }
    );
  }
}
