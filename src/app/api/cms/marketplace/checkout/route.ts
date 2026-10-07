import { NextResponse } from "next/server";
import {
  normalizeCheckoutPage,
  validateCheckoutPageForSave,
} from "@/lib/cms/checkout-page/defaults";
import type { CheckoutPageSettings } from "@/lib/cms/checkout-page/types";
import {
  readCheckoutPage,
  saveCheckoutPage,
} from "@/lib/cms/server/checkout-page.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await readCheckoutPage({ fresh: true });
    return NextResponse.json(data, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      { error: "Failed to load checkout page" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;

    const payload = (await request.json()) as CheckoutPageSettings;
    const normalized = normalizeCheckoutPage(payload);
    const validationError = validateCheckoutPageForSave(normalized);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const saved = await saveCheckoutPage(normalized);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save checkout page",
      },
      { status: 500 }
    );
  }
}
