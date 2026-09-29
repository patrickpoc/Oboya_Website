import { NextResponse } from "next/server";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import {
  deleteBlogPostDurable,
  readBlogPostsDurable,
  reorderBlogPostsDurable,
  saveBlogPostDurable,
} from "@/lib/cms/server/blog-posts.server";
import { revalidateBlogPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import type { LocalizedString } from "@/lib/cms/types";
import { slugify } from "@/lib/cms/slugify";
import {
  pendingApprovalResponse,
  stripApprovalMeta,
  submitOrApply,
} from "@/lib/cms/server/approvals.server";
import { diffJson, summarizeDiff } from "@/lib/cms/approvals/diff";

const EMPTY_LOCALIZED: LocalizedString = {
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
};

function toListPost(post: CmsBlogPost): CmsBlogPost {
  return {
    ...post,
    body: EMPTY_LOCALIZED,
  };
}

async function findPost(id: string) {
  return (await readBlogPostsDurable({ fresh: true })).find((post) => post.id === id) ?? null;
}

function postLabel(post: Pick<CmsBlogPost, "title" | "slug" | "id"> | null, id: string) {
  return post?.title?.en || post?.title?.["pt-BR"] || post?.slug || id;
}

export async function GET(request: Request) {
  const auth = await cmsGuard("blog", "view");
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const fields = url.searchParams.get("fields");
  const posts = await readBlogPostsDurable({ fresh: true });

  if (id) {
    const post = posts.find((item) => item.id === id);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  }

  if (fields === "list") {
    return NextResponse.json(posts.map(toListPost));
  }

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const auth = await cmsGuard("blog", "edit");
  if ("response" in auth) return auth.response;
  const body = stripApprovalMeta(
    (await request.json()) as CmsBlogPost & {
      action?: string;
      orderedIds?: string[];
    }
  );

  if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
    const next = await reorderBlogPostsDurable(body.orderedIds);
    revalidateBlogPages();
    return NextResponse.json({ ok: true, posts: next.map(toListPost) });
  }

  const slug = slugify(body.slug || body.title?.en || body.id || "post");
  const post: CmsBlogPost = { ...body, slug: slug || `post-${Date.now()}` };
  const gate = await submitOrApply({
    user: auth.user,
    changeType: "blog.upsert",
    entityId: post.id,
    entityLabel: postLabel(post, post.id),
    action: "update",
    payload: post,
    loadSnapshot: () => findPost(post.id),
    diff: (before) => ({ entries: diffJson(before, post) }),
    summary: (d) => summarizeDiff(d.entries),
    apply: async () => {
      const saved = await saveBlogPostDurable(post);
      revalidateBlogPages(saved.slug);
      return saved;
    },
  });
  if (!gate.applied) return pendingApprovalResponse(gate.request, post);
  return NextResponse.json(gate.result, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("blog", "delete");
  if ("response" in auth) return auth.response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const existing = await findPost(id);
  const gate = await submitOrApply({
    user: auth.user,
    changeType: "blog.delete",
    entityId: id,
    entityLabel: postLabel(existing, id),
    action: "delete",
    payload: { id },
    snapshot: existing,
    diff: { entries: [{ path: "(delete)", before: existing?.slug ?? id, after: null }] },
    summary: `Delete post ${postLabel(existing, id)}`,
    apply: async () => {
      await deleteBlogPostDurable(id);
      revalidateBlogPages(existing?.slug);
    },
  });
  if (!gate.applied) return pendingApprovalResponse(gate.request, { ok: false });
  return NextResponse.json({ ok: true });
}
