import { NextResponse } from "next/server";
import {
  deleteFaqCategoryDurable,
  deleteFaqItemDurable,
  readFaqsDurable,
  saveFaqCategoryDurable,
  saveFaqItemDurable,
} from "@/lib/cms/server/faqs.server";
import type {
  CmsFaqCategory,
  CmsFaqItem,
} from "@/lib/cms/repositories/faqs-repository";
import { revalidateFaqPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  pendingApprovalResponse,
  stripApprovalMeta,
  submitOrApply,
} from "@/lib/cms/server/approvals.server";
import { diffJson, summarizeDiff } from "@/lib/cms/approvals/diff";

type FaqType = "category" | "faq";

async function findCurrent(type: FaqType, id: string) {
  const doc = await readFaqsDurable();
  const list: Array<{ id: string }> = type === "category" ? doc.categories : doc.faqs;
  return list.find((item) => item.id === id) ?? null;
}

function faqLabel(type: FaqType, data: Partial<CmsFaqCategory & CmsFaqItem> | null, id: string) {
  const text = type === "category" ? data?.title?.en : data?.question?.en;
  return `${type === "category" ? "FAQ category" : "FAQ"} · ${text || id}`;
}

export async function GET() {
  return NextResponse.json(await readFaqsDurable());
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as {
    type: FaqType;
    data: CmsFaqCategory | CmsFaqItem;
  };

  if (body.type !== "category" && body.type !== "faq") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const type = body.type;
  const data = stripApprovalMeta(body.data);
  const gate = await submitOrApply({
    user: auth.user,
    changeType: "website.faqs",
    entityId: data.id,
    entityLabel: faqLabel(type, data as CmsFaqItem, data.id),
    action: "update",
    payload: { op: "save", type, data },
    loadSnapshot: () => findCurrent(type, data.id),
    diff: (before) => ({ entries: diffJson(before, data) }),
    summary: (d) => summarizeDiff(d.entries),
    apply: async () => {
      const saved =
        type === "category"
          ? await saveFaqCategoryDurable(data as CmsFaqCategory)
          : await saveFaqItemDurable(data as CmsFaqItem);
      revalidateFaqPages();
      return saved;
    },
  });
  if (!gate.applied) return pendingApprovalResponse(gate.request, data);
  return NextResponse.json(gate.result);
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("website", "delete");
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }
  if (type !== "category" && type !== "faq") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const existing = await findCurrent(type, id);
  const gate = await submitOrApply({
    user: auth.user,
    changeType: "website.faqs",
    entityId: id,
    entityLabel: faqLabel(type, existing as CmsFaqItem | null, id),
    action: "delete",
    payload: { op: "delete", type, id },
    snapshot: existing,
    diff: { entries: [{ path: "(delete)", before: id, after: null }] },
    summary: `Delete ${type} ${id}`,
    apply: async () => {
      if (type === "category") await deleteFaqCategoryDurable(id);
      else await deleteFaqItemDurable(id);
      revalidateFaqPages();
    },
  });
  if (!gate.applied) return pendingApprovalResponse(gate.request, { ok: false });
  return NextResponse.json({ ok: true });
}
