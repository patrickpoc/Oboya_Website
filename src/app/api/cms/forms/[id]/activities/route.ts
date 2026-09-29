import { NextResponse } from "next/server";
import { addFormActivities, readFormActivities, readFormSubmissionById } from "@/lib/cms/server/forms.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await cmsGuard("forms", "view");
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const item = await readFormSubmissionById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const activities = await readFormActivities(id);
  return NextResponse.json({ activities }, { headers: noStoreHeaders });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await cmsGuard("forms", "edit");
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const item = await readFormSubmissionById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowedKinds = new Set(["note", "reply", "pii"]);
  const body = (await request.json().catch(() => null)) as { body?: string; kind?: string } | null;
  const kind = allowedKinds.has(String(body?.kind)) ? (body!.kind as "note" | "reply" | "pii") : "note";
  const note = String(body?.body ?? "").trim();
  if (kind === "note" && !note) return NextResponse.json({ error: "Note is required" }, { status: 400 });
  if (note.length > 4000) {
    return NextResponse.json({ error: "Note is too long" }, { status: 400 });
  }
  const [activity] = await addFormActivities([
    { submissionId: id, kind, body: note || null, actor: { id: auth.user.id, name: auth.user.name } },
  ]);
  return NextResponse.json({ activity });
}
