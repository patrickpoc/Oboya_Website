import { NextResponse } from "next/server";
import {
  CHANGE_REQUEST_STATUSES,
  OPEN_CHANGE_REQUEST_STATUSES,
  type ChangeRequest,
  type ChangeRequestStatus,
} from "@/lib/cms/approvals/types";
import { cmsGuardSession } from "@/lib/cms/server/require-cms-auth";
import { listChangeRequests } from "@/lib/cms/server/change-requests.server";
import { listReviewableRequests } from "@/lib/cms/server/approvals.server";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseStatuses(raw: string | null): ChangeRequestStatus[] | undefined {
  if (!raw) return undefined;
  if (raw === "open") return OPEN_CHANGE_REQUEST_STATUSES;
  const list = raw
    .split(",")
    .filter((s): s is ChangeRequestStatus =>
      (CHANGE_REQUEST_STATUSES as readonly string[]).includes(s)
    );
  return list.length ? list : undefined;
}

/** List payloads omit full proposed/snapshot bodies; the detail route returns them. */
function toListItem(req: ChangeRequest): ChangeRequest {
  return { ...req, payloadProposed: null, snapshotBefore: null };
}

export async function GET(request: Request) {
  try {
    const auth = await cmsGuardSession();
    if ("response" in auth) return auth.response;
    const user = auth.user;

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") ?? "mine";
    const statuses = parseStatuses(url.searchParams.get("status"));
    const module = url.searchParams.get("module") ?? undefined;
    const requestedBy = url.searchParams.get("requestedBy") ?? undefined;

    let items: ChangeRequest[];
    if (scope === "review") {
      items = await listReviewableRequests(user, statuses ?? OPEN_CHANGE_REQUEST_STATUSES);
      if (module) items = items.filter((r) => r.module === module);
    } else if (scope === "all") {
      if (user.role !== "super_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      items = await listChangeRequests({ statuses, module, requestedBy, limit: 500 });
    } else if (scope === "entity") {
      const entityType = url.searchParams.get("entityType");
      const entityId = url.searchParams.get("entityId");
      if (!entityType || !entityId) {
        return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
      }
      items = await listChangeRequests({
        statuses: statuses ?? OPEN_CHANGE_REQUEST_STATUSES,
        entityType,
        entityId,
      });
    } else {
      items = await listChangeRequests({ statuses, module, requestedBy: user.id });
    }

    return NextResponse.json(
      { items: items.map(toListItem) },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("Failed to list change requests:", error);
    return NextResponse.json({ items: [], error: "Failed to list change requests" }, { status: 500 });
  }
}
