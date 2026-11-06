import { NextResponse } from "next/server";
import type { AccessControlDoc } from "@/lib/cms/permissions/access-types";
import {
  readAccessControlDurable,
  readAccessControlStrict,
  sanitizeAccessDoc,
  saveAccessControlDurable,
} from "@/lib/cms/server/access-control.server";
import {
  cmsGuardSession,
  cmsGuardSuperAdmin,
} from "@/lib/cms/server/require-cms-auth";
import { CmsReadError, isEditRead, readFailureResponse } from "@/lib/cms/server/strict-read";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const auth = await cmsGuardSession();
    if ("response" in auth) return auth.response;

    // forEdit: the editor saves what it loads, so no defaults on a failed read.
    const doc = isEditRead(request)
      ? await readAccessControlStrict()
      : await readAccessControlDurable();
    return NextResponse.json(doc, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
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
    if (
      !payload ||
      !Array.isArray(payload.roles) ||
      !payload.matrix ||
      typeof payload.matrix !== "object" ||
      Array.isArray(payload.matrix)
    ) {
      return NextResponse.json(
        { error: "Invalid access control document" },
        { status: 400 }
      );
    }

    // Same check as the strict read, but a bad row is rejected instead of dropped.
    const { droppedRoles, droppedMatrixRows } = sanitizeAccessDoc(
      payload as unknown as Parameters<typeof sanitizeAccessDoc>[0]
    );
    if (droppedRoles > 0 || droppedMatrixRows.length > 0) {
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
