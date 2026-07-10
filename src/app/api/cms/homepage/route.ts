import { NextResponse } from "next/server";
import {
  getHomepageSettings,
  saveHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";

export async function GET() {
  return NextResponse.json(getHomepageSettings());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as HomepageSettings;
  const saved = saveHomepageSettings(body);
  return NextResponse.json(saved);
}
