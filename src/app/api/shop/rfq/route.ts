import { NextResponse } from "next/server";
import { addFormSubmission } from "@/lib/cms/repositories/forms-repository";
import type { RfqPayload } from "@/lib/shop/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RfqPayload;

    if (!body.company?.trim() || !body.email?.trim() || !body.contactName?.trim()) {
      return NextResponse.json(
        { error: "Company, contact name and email are required" },
        { status: 400 }
      );
    }

    if (!body.items?.length) {
      return NextResponse.json(
        { error: "At least one product is required" },
        { status: 400 }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const referenceId = `RFQ-${Date.now().toString().slice(-8)}`;

    addFormSubmission({
      type: "quote",
      status: "new",
      data: {
        referenceId,
        company: body.company,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        country: body.country,
        message: body.message,
        items: body.items.length,
        total: body.estimatedTotal,
        currency: body.currency,
      },
    });

    return NextResponse.json({ referenceId, ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process quotation request" },
      { status: 500 }
    );
  }
}
