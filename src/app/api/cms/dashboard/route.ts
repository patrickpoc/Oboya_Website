import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/cms/adapters/mock/dashboard";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  const auth = await cmsGuard("dashboard", "view");
  if ("response" in auth) return auth.response;
  return NextResponse.json(getDashboardStats());
}
