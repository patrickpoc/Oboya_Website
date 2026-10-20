import { NextResponse } from "next/server";
import { diffJson, summarizeDiff } from "@/lib/cms/approvals/diff";
import type { OpeningAction } from "@/lib/cms/careers/lifecycle";
import type { OpeningFilters, JobOpening } from "@/lib/cms/careers/types";
import { normalizeOpening, validateOpening } from "@/lib/cms/careers/validation";
import { pendingApprovalResponse, stripApprovalMeta, submitOrApply } from "@/lib/cms/server/approvals.server";
import {
  buildOpeningForAction,
  countOpeningApplications,
  deleteOpening,
  getOpening,
  listOpenings,
  saveOpening,
} from "@/lib/cms/server/careers-openings.server";
import { CareersError, UUID_RE, careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";
import type { CmsAction, CmsUser } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Action = "upsert" | "duplicate" | OpeningAction;
const ACTIONS: Action[] = ["upsert", "duplicate", "close", "reopen", "archive", "publish"];

const label = (o: Pick<JobOpening, "title" | "slug" | "id"> | null, id: string) =>
  o?.title?.en || o?.slug || id;

export async function GET(request: Request) {
  const auth = await cmsGuard("careers", "view");
  if ("response" in auth) return auth.response;
  try {
    const q = new URL(request.url).searchParams;
    const filters: OpeningFilters = {
      q: q.get("q") ?? undefined,
      status: (q.get("status") as OpeningFilters["status"]) ?? undefined,
      department: q.get("department") ?? undefined,
      countryCode: q.get("country") ?? undefined,
      workModel: (q.get("workModel") as OpeningFilters["workModel"]) ?? undefined,
    };
    return NextResponse.json({ items: await listOpenings(filters) }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to load openings");
  }
}

const LIVE: JobOpening["status"][] = ["published", "closed"];

/** Permission per action; the body is read after a base `view` check, then re-checked here. */
function actionPermission(action: Action, current: JobOpening | null, next?: JobOpening): CmsAction {
  if (action === "duplicate") return "create";
  if (action === "upsert") {
    // Editing a live opening, or moving to published/closed, needs publish rights.
    const live =
      (current && LIVE.includes(current.status)) || (next && LIVE.includes(next.status));
    return live ? "publish" : current ? "edit" : "create";
  }
  // Archiving a published/closed opening is a publish-level change; a draft only needs edit.
  if (action === "archive") return current && LIVE.includes(current.status) ? "publish" : "edit";
  return "publish";
}

export async function POST(request: Request) {
  const base = await cmsGuard("careers", "view");
  if ("response" in base) return base.response;
  try {
    const body = stripApprovalMeta(
      (await request.json().catch(() => null)) as {
        action?: string;
        id?: string;
        opening?: unknown;
      } | null
    );
    const action = (body?.action ?? "upsert") as Action;
    if (!ACTIONS.includes(action)) throw new CareersError(400, "invalidAction");

    let proposed: JobOpening;
    let user: CmsUser;
    if (action === "upsert") {
      proposed = normalizeOpening(body?.opening);
      const current = UUID_RE.test(proposed.id) ? await getOpening(proposed.id) : null;
      const auth = await cmsGuard("careers", actionPermission(action, current, proposed));
      if ("response" in auth) return auth.response;
      user = auth.user;
      const valid = validateOpening(proposed);
      if (!valid.ok) throw new CareersError(400, valid.errors[0]);
    } else {
      const id = String(body?.id ?? "");
      if (!UUID_RE.test(id)) throw new CareersError(400, "invalidId");
      const current = action === "archive" ? await getOpening(id) : null;
      const auth = await cmsGuard("careers", actionPermission(action, current));
      if ("response" in auth) return auth.response;
      user = auth.user;
      proposed = await buildOpeningForAction(id, action);
    }

    const gate = await submitOrApply({
      user,
      changeType: "careers.upsert",
      entityId: proposed.id || "new",
      entityLabel: label(proposed, proposed.id),
      action: "update",
      payload: proposed,
      loadSnapshot: () => getOpening(proposed.id),
      diff: (before) => ({ entries: diffJson(before, proposed) }),
      summary: (d) => summarizeDiff(d.entries),
      apply: () => saveOpening(proposed, { id: user.id }),
    });
    if (!gate.applied) return pendingApprovalResponse(gate.request, { item: proposed });
    return NextResponse.json({ item: gate.result }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to save opening");
  }
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("careers", "delete");
  if ("response" in auth) return auth.response;
  try {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!UUID_RE.test(id)) throw new CareersError(400, "invalidId");
    const existing = await getOpening(id);
    if (!existing) throw new CareersError(404, "not_found");
    if ((await countOpeningApplications(id)) > 0) throw new CareersError(409, "hasApplications");
    const gate = await submitOrApply({
      user: auth.user,
      changeType: "careers.delete",
      entityId: id,
      entityLabel: label(existing, id),
      action: "delete",
      payload: { id },
      snapshot: existing,
      diff: { entries: [{ path: "(delete)", before: existing.slug, after: null }] },
      summary: `Delete job opening ${label(existing, id)}`,
      apply: () => deleteOpening(id),
    });
    if (!gate.applied) return pendingApprovalResponse(gate.request, { ok: false });
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to delete opening");
  }
}
