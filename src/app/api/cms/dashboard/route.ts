import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/cms/adapters/mock/dashboard";

export async function GET() {
  return NextResponse.json(getDashboardStats());
}
