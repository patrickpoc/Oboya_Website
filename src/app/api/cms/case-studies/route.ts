import { NextResponse } from "next/server";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import { revalidatePublicSite } from "@/lib/cms/server/cms-revalidate.server";
import {
  deleteCaseDurable,
  readCasesDurable,
  saveCaseDurable,
} from "@/lib/cms/server/content.server";

export async function GET() {
  return NextResponse.json(await readCasesDurable());
}

export async function POST(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  try {
    const body = (await request.json()) as CmsCaseStudy;
    const saved = await saveCaseDurable(body);
    revalidatePublicSite(["/case-studies"]);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Failed to save case study:", error);
    return NextResponse.json(
      { error: "Failed to save case study" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteCaseDurable(id);
  revalidatePublicSite(["/case-studies"]);
  return NextResponse.json({ ok: true });
}
