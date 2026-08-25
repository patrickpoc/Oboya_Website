import { NextResponse } from "next/server";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import { revalidatePublicSite } from "@/lib/cms/server/cms-revalidate.server";
import {
  readAboutDurable,
  saveAboutDurable,
} from "@/lib/cms/server/content.server";

export async function GET() {
  return NextResponse.json(await readAboutDurable());
}

export async function PUT(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  try {
    const body = (await request.json()) as AboutPageSettings;
    const saved = await saveAboutDurable(body);
    revalidatePublicSite(["/about", "/about-v2"]);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to save about settings:", error);
    return NextResponse.json(
      { error: "Failed to save about settings" },
      { status: 500 }
    );
  }
}
