import { NextResponse } from "next/server";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import { revalidatePublicSite } from "@/lib/cms/server/cms-revalidate.server";
import {
  readNewsDurable,
  saveNewsDurable,
} from "@/lib/cms/server/content.server";

export async function GET() {
  return NextResponse.json(await readNewsDurable());
}

export async function PUT(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  try {
    const body = (await request.json()) as NewsPageSettings;
    const saved = await saveNewsDurable(body);
    revalidatePublicSite(["/news"]);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to save news page settings:", error);
    return NextResponse.json(
      { error: "Failed to save news page settings" },
      { status: 500 }
    );
  }
}
