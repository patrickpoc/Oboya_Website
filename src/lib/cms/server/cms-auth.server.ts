import "server-only";

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

/**
 * When Supabase auth is configured, require an admin session.
 * Returns a 401 response if unauthorized; otherwise null.
 */
export async function unauthorizedIfNeeded(): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
