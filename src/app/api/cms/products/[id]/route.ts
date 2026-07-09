import { NextResponse } from "next/server";
import {
  getCmsProductById,
  saveCmsProduct,
  deleteCmsProduct,
} from "@/lib/cms/repositories/product-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = getCmsProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  if (body.id !== id) {
    return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
  }
  return NextResponse.json(saveCmsProduct(body));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteCmsProduct(id);
  return NextResponse.json({ ok: true });
}
