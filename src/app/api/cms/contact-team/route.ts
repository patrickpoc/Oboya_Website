import { NextResponse } from "next/server";
import { normalizeContactTeam } from "@/lib/cms/repositories/contact-team-repository";
import { readContactTeam } from "@/lib/cms/readers";
import {
  readContactTeamStrict,
  saveContactTeamDurable,
} from "@/lib/cms/server/contact-team.server";
import { revalidateContactPages } from "@/lib/cms/revalidate-site";
import { CmsReadError, isEditRead, readFailureResponse } from "@/lib/cms/server/strict-read";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  approvalErrorResponse,
  gateSettingsDocument,
} from "@/lib/cms/server/approvals.server";

export async function GET(request: Request) {
  try {
    if (isEditRead(request)) {
      // Guard first: the strict read uses the session client.
      const auth = await cmsGuard("website", "view");
      if ("response" in auth) return auth.response;
      return NextResponse.json(await readContactTeamStrict());
    }
    // Public read: enabled people only (disabled contacts must not leak).
    return NextResponse.json(await readContactTeam());
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    console.error("Failed to load contact team:", error);
    return NextResponse.json({ error: "Failed to load contact team" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;
  try {
    const input: unknown = await request.json();
    if (!Array.isArray(input)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    // Normalize before the approval gate so approvers see what will be saved.
    const body = normalizeContactTeam(input);
    return await gateSettingsDocument({
      user: auth.user,
      changeType: "website.contact_team",
      entityId: "contact-team",
      entityLabel: "Contact team",
      body,
      read: readContactTeamStrict,
      save: saveContactTeamDurable,
      revalidate: revalidateContactPages,
    });
  } catch (error) {
    return approvalErrorResponse(error, "Failed to save contact team");
  }
}
