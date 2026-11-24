import { NextResponse } from "next/server";
import { PRODUCT_BOOST_MAX, PRODUCT_BOOST_MIN } from "@/lib/shop/boost";

export const SCHEMA_PENDING_MESSAGE = "Product schema update pending";

/** True when `boost` is absent or a whole number inside the allowed range. */
export function isValidBoostField(value: unknown): boolean {
  if (value === undefined) return true;
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= PRODUCT_BOOST_MIN &&
    value <= PRODUCT_BOOST_MAX
  );
}

/** 400 response when any product carries an invalid `boost`; null when all are fine. */
export function invalidBoostResponse(products: unknown[]): NextResponse | null {
  const bad = products.find(
    (product) =>
      product && typeof product === "object" && !isValidBoostField((product as { boost?: unknown }).boost)
  ) as { id?: string; sku?: string } | undefined;
  if (!bad) return null;
  return NextResponse.json(
    {
      error: `Boost must be a whole number from ${PRODUCT_BOOST_MIN} to ${PRODUCT_BOOST_MAX}.`,
      field: "boost",
      productId: bad.id,
      sku: bad.sku,
    },
    { status: 400 }
  );
}

/** Generic 503 for write errors caused by a pending database migration. */
export function schemaPendingResponse(error: unknown): NextResponse | null {
  if ((error as { status?: number } | null)?.status !== 503) return null;
  console.error(error);
  return NextResponse.json({ error: SCHEMA_PENDING_MESSAGE }, { status: 503 });
}
