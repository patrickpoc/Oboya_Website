import { NextResponse } from "next/server";
import { validateShopConfigForSave } from "@/lib/cms/shop-config/defaults";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import {
  readMarketplaceShopConfig,
  saveMarketplaceShopConfig,
} from "@/lib/cms/server/marketplace-config.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await readMarketplaceShopConfig();
    return NextResponse.json(data, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      { error: "Failed to load shop configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;

    const payload = (await request.json()) as ShopConfig;
    const validationError = validateShopConfigForSave(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const saved = await saveMarketplaceShopConfig(payload);
    try {
      const { revalidateShopPages } = await import("@/lib/cms/revalidate-site");
      revalidateShopPages();
    } catch {
      // Ignore when revalidation is unavailable.
    }
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save shop configuration",
      },
      { status: 500 }
    );
  }
}
