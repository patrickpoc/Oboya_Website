import { NextResponse } from "next/server";
import {
  getAboutPageSettings,
  saveAboutPageSettings,
  type AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";

export async function GET() {
  return NextResponse.json(getAboutPageSettings());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as AboutPageSettings;
  const saved = saveAboutPageSettings(body);
  return NextResponse.json(saved);
}
