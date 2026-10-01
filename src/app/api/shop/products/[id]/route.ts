import { NextResponse } from "next/server";
import { readPublishedProductByParam } from "@/lib/cms/readers";
import { toPublicProduct } from "@/lib/cms/server/public-product";

/**
 * Public product detail (with description HTML) for the shop quick view.
 * Cached per product and busted by that product's tag on CMS writes; must
 * stay free of request-time APIs. Admin draft reads use /api/cms/products/[id].
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await readPublishedProductByParam(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(toPublicProduct(product));
}
