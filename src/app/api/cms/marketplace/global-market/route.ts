import { NextResponse } from "next/server";
import {
  readMarketplaceCurrenciesStrict,
  readMarketplaceShopConfigStrict,
  saveMarketplaceGlobalCountry,
} from "@/lib/cms/server/marketplace-config.server";
import { addAuditLogDurable } from "@/lib/cms/server/audit-logs.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  CmsReadError,
  isEditRead,
  readFailureResponse,
} from "@/lib/cms/server/strict-read";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { publicApiError } from "@/lib/security/public-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    if (!isEditRead(request)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const auth = await cmsGuard("marketplace", "view");
    if ("response" in auth) return auth.response;
    const config = await readMarketplaceShopConfigStrict();
    return NextResponse.json(
      { globalCountryCode: config.market.globalCountryCode },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    return publicApiError(error, "Failed to load global display");
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const raw = body?.globalCountryCode;
    if (
      !body ||
      typeof body !== "object" ||
      (raw !== null && (typeof raw !== "string" || !/^[A-Za-z]{2}$/.test(raw)))
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const code = raw === null ? null : (raw as string).toUpperCase();

    if (code) {
      const { countries } = await readMarketplaceCurrenciesStrict();
      if (!countries.some((country) => country.code.toUpperCase() === code)) {
        return NextResponse.json(
          { error: "Country is not active in the store." },
          { status: 400 }
        );
      }
    }

    const { config: saved, previous } = await saveMarketplaceGlobalCountry(code);

    try {
      await addAuditLogDurable({
        userId: auth.user.id,
        userName: auth.user.name,
        action: "update",
        module: "marketplace",
        resourceId: "global-market",
        details: JSON.stringify({ from: previous, to: code }),
      });
    } catch (auditError) {
      console.error("global market audit failed", auditError);
    }

    return NextResponse.json(
      { globalCountryCode: saved.market.globalCountryCode },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    return publicApiError(error, "Failed to save global display");
  }
}
