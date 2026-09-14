import { NextResponse } from "next/server";
import { addFormSubmissionDurable } from "@/lib/cms/server/forms.server";
import { readProducts } from "@/lib/cms/server/products.server";
import { readMarketplaceCurrencies } from "@/lib/cms/server/marketplace-config.server";
import { readMapLocations } from "@/lib/map-locations.server";
import { clampQuantity, getProductMoq, MAX_QUANTITY } from "@/lib/shop/quantity";
import {
  getActiveVariant,
  getVariantDisplayName,
  hasColorVariants,
  resolveVariantPrice,
  resolveVariantSku,
  sortedColorVariants,
} from "@/lib/shop/color-variants";
import { isValidEmail } from "@/lib/security/email";
import { assertFormRateLimit } from "@/lib/security/rate-limit";
import { clientIpFromRequest, hashClientIp } from "@/lib/security/client-ip";
import { PRIVACY_NOTICE_VERSION } from "@/lib/security/privacy-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";

const COMPANY_MAX = 120;
const NAME_MAX = 120;
const PHONE_MAX = 32;
const MESSAGE_MAX = 2000;
const ITEMS_MAX = 50;

function asString(value: unknown): string {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  if (isSupabaseConfigured() && !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const company = asString(body.company);
    const contactName = asString(body.contactName);
    const email = asString(body.email);
    const phone = asString(body.phone);
    const country = asString(body.country);
    const countryCode = asString(body.countryCode);
    const currency = asString(body.currency);
    const message = asString(body.message);
    const officeIdRaw = asString(body.officeId);
    const officeId = officeIdRaw || null;
    const privacyAccepted = body.privacyAccepted === true;
    const marketingOptIn = body.marketingOptIn === true;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!company || !contactName || !email || !phone) {
      return NextResponse.json(
        { error: "Company, contact name, email and phone are required" },
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

    if (company.length > COMPANY_MAX || contactName.length > NAME_MAX) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }
    if (phone.length > PHONE_MAX) {
      return NextResponse.json({ error: "Phone is too long" }, { status: 400 });
    }
    if (message.length > MESSAGE_MAX) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json(
        { error: "At least one product is required" },
        { status: 400 }
      );
    }
    if (items.length > ITEMS_MAX) {
      return NextResponse.json(
        { error: `At most ${ITEMS_MAX} products per request` },
        { status: 400 }
      );
    }

    if (!countryCode || !currency) {
      return NextResponse.json(
        { error: "Country and currency are required" },
        { status: 400 }
      );
    }

    const [catalog, mapData] = await Promise.all([
      readMarketplaceCurrencies(),
      readMapLocations(),
    ]);
    const market = catalog.countries.find((entry) => entry.code === countryCode);
    if (!market) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    }
    const allowedCurrencies = new Set([
      ...catalog.currencies,
      ...market.currencies,
      market.defaultCurrency,
    ]);
    if (!allowedCurrencies.has(currency)) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }

    const officeIds = new Set(
      mapData.locations.flatMap((location) =>
        location.offices.map((office) => office.id)
      )
    );
    if (officeId && !officeIds.has(officeId)) {
      return NextResponse.json({ error: "Invalid sales office" }, { status: 400 });
    }

    const ipHash = hashClientIp(clientIpFromRequest(request));
    const limited = await assertFormRateLimit({ email, ipHash });
    if (!limited.ok) {
      return NextResponse.json({ error: limited.error }, { status: 429 });
    }

    const products = await readProducts({ includeDeleted: false });
    const published = new Map(
      products
        .filter((product) => product.status === "published" && !product.deletedAt)
        .map((product) => [product.id, product])
    );

    const validatedItems: Array<{
      productId: string;
      variantId: string | null;
      variantName: string | null;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    for (const rawItem of items) {
      const item = (rawItem ?? {}) as Record<string, unknown>;
      const productId = asString(item.productId);
      const product = published.get(productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not available: ${productId}` },
          { status: 400 }
        );
      }

      const enabledMap = product.enabledCountries ?? product.availability;
      if (!enabledMap[countryCode]) {
        return NextResponse.json(
          { error: `Product not available in market: ${product.sku}` },
          { status: 400 }
        );
      }

      const variantId = asString(item.variantId) || null;
      const variant = variantId
        ? sortedColorVariants(product).find((entry) => entry.id === variantId) ??
          null
        : null;
      if (variantId && !variant) {
        return NextResponse.json(
          { error: `Color variant not available for ${product.sku}` },
          { status: 400 }
        );
      }

      const displayVariant =
        variant ??
        (hasColorVariants(product) ? getActiveVariant(product, null) : null);
      const variantName = displayVariant
        ? getVariantDisplayName(displayVariant, "en")
        : null;

      const unitPrice = resolveVariantPrice(product, variant, currency);
      if (unitPrice <= 0) {
        return NextResponse.json(
          { error: `No price for product ${product.sku} in ${currency}` },
          { status: 400 }
        );
      }

      if (!product.unlimitedStock) {
        const stock = product.stockQuantity ?? 0;
        if (stock <= 0) {
          return NextResponse.json(
            { error: `Product out of stock: ${product.sku}` },
            { status: 400 }
          );
        }
      }

      const moq = getProductMoq(product);
      const requestedQty = Number(item.quantity);
      const quantity = clampQuantity(requestedQty, moq);
      if (!Number.isFinite(requestedQty) || requestedQty < moq) {
        return NextResponse.json(
          { error: `Quantity below MOQ for ${product.sku}` },
          { status: 400 }
        );
      }
      if (quantity > MAX_QUANTITY) {
        return NextResponse.json(
          { error: `Quantity too large for ${product.sku}` },
          { status: 400 }
        );
      }
      if (
        !product.unlimitedStock &&
        product.stockQuantity != null &&
        quantity > product.stockQuantity
      ) {
        return NextResponse.json(
          { error: `Quantity exceeds stock for ${product.sku}` },
          { status: 400 }
        );
      }

      const name =
        product.name?.en || product.name?.["pt-BR"] || product.sku;

      validatedItems.push({
        productId: product.id,
        variantId,
        variantName: hasColorVariants(product) ? variantName : null,
        sku: resolveVariantSku(product, displayVariant),
        name:
          hasColorVariants(product) && variantName
            ? `${name} (${variantName})`
            : name,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      });
    }

    const estimatedTotal = validatedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
    const referenceId = `RFQ-${crypto.randomUUID()}`;

    await addFormSubmissionDurable({
      type: "quote",
      status: "new",
      data: {
        referenceId,
        company,
        contactName,
        email,
        phone,
        country: country || market.name,
        countryCode,
        message,
        currency,
        officeId,
        items: validatedItems,
        itemCount: validatedItems.length,
        total: estimatedTotal,
        marketingOptIn,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        acceptedAt: new Date().toISOString(),
        meta: { ipHash },
      },
    });

    return NextResponse.json({
      referenceId,
      ok: true,
      estimatedTotal,
      itemCount: validatedItems.length,
    });
  } catch (error) {
    console.error("Failed to process quotation request:", error);
    return NextResponse.json(
      { error: "Failed to process quotation request" },
      { status: 500 }
    );
  }
}
