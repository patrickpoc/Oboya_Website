import { NextResponse } from "next/server";
import type { AccessControlDoc } from "@/lib/cms/permissions/access-types";
import {
  readAccessControlDurable,
  saveAccessControlDurable,
} from "@/lib/cms/server/access-control.server";
import {
  cmsGuardSession,
  cmsGuardSuperAdmin,
} from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const auth = await cmsGuardSession();
    if ("response" in auth) return auth.response;

    const doc = await readAccessControlDurable();
    return NextResponse.json(doc, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Failed to load access control:", error);
    return NextResponse.json(
      { error: "Failed to load access control" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await cmsGuardSuperAdmin();
    if ("response" in auth) return auth.response;

    const payload = (await request.json()) as AccessControlDoc;
    if (!payload || !Array.isArray(payload.roles) || !payload.matrix) {
      return NextResponse.json(
        { error: "Invalid access control document" },
        { status: 400 }
      );
    }

    const saved = await saveAccessControlDurable(payload);
    return NextResponse.json(saved, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Failed to save access control:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save access control",
      },
      { status: 500 }
    );
  }
}
