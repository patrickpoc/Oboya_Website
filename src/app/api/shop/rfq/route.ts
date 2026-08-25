import { NextResponse } from "next/server";
import { addFormSubmissionDurable } from "@/lib/cms/server/forms.server";
import { readProducts } from "@/lib/cms/server/products.server";
import { clampQuantity, getProductMoq, MAX_QUANTITY } from "@/lib/shop/quantity";
import type { RfqPayload } from "@/lib/shop/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RfqPayload;

    const company = body.company?.trim() ?? "";
    const contactName = body.contactName?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const country = body.country?.trim() ?? "";
    const countryCode = body.countryCode?.trim() ?? "";
    const currency = body.currency?.trim() ?? "";

    if (!company || !contactName || !email) {
      return NextResponse.json(
        { error: "Company, contact name and email are required" },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!body.items?.length) {
      return NextResponse.json(
        { error: "At least one product is required" },
        { status: 400 }
      );
    }

    if (!countryCode || !currency) {
      return NextResponse.json(
        { error: "Country and currency are required" },
        { status: 400 }
      );
    }

    const products = await readProducts({ includeDeleted: false });
    const published = new Map(
      products
        .filter((product) => product.status === "published" && !product.deletedAt)
        .map((product) => [product.id, product])
    );

    const validatedItems: Array<{
      productId: string;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    for (const item of body.items) {
      const product = published.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not available: ${item.productId}` },
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

      const unitPrice = product.prices[currency];
      if (unitPrice === undefined || unitPrice <= 0) {
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
      const quantity = clampQuantity(Number(item.quantity), moq);
      if (!Number.isFinite(item.quantity) || item.quantity < moq) {
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
        product.name?.en ||
        product.name?.["pt-BR"] ||
        product.sku;

      validatedItems.push({
        productId: product.id,
        sku: product.sku,
        name,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      });
    }

    const estimatedTotal = validatedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
    const referenceId = `RFQ-${Date.now().toString().slice(-8)}`;

    await addFormSubmissionDurable({
      type: "quote",
      status: "new",
      data: {
        referenceId,
        company,
        contactName,
        email,
        phone,
        country,
        countryCode,
        message: body.message?.trim() ?? "",
        currency,
        officeId: body.officeId ?? null,
        items: validatedItems,
        itemCount: validatedItems.length,
        total: estimatedTotal,
      },
    });

    return NextResponse.json({
      referenceId,
      ok: true,
      estimatedTotal,
      itemCount: validatedItems.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process quotation request" },
      { status: 500 }
    );
  }
}
