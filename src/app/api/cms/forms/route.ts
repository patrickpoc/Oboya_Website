import { NextResponse } from "next/server";
import { getFormSubmissions } from "@/lib/cms/repositories/forms-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as
    | "contact"
    | "quote"
    | "newsletter"
    | "career"
    | null;

  const submissions = getFormSubmissions(type ?? undefined);
  return NextResponse.json(submissions);
}
