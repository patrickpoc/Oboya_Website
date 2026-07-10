import { NextResponse } from "next/server";
import {
  getNewsPageSettings,
  saveNewsPageSettings,
  type NewsPageSettings,
} from "@/lib/cms/repositories/news-page-repository";

export async function GET() {
  return NextResponse.json(getNewsPageSettings());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as NewsPageSettings;
  const saved = saveNewsPageSettings(body);
  return NextResponse.json(saved);
}
