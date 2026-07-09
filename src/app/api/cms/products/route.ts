import { NextResponse } from "next/server";
import { getCmsProducts } from "@/lib/cms/repositories/product-repository";

export async function GET() {
  return NextResponse.json(getCmsProducts());
}

export async function POST(request: Request) {
  const body = await request.json();
  const { saveCmsProduct } = await import("@/lib/cms/repositories/product-repository");
  const saved = saveCmsProduct(body);
  return NextResponse.json(saved, { status: 201 });
}
