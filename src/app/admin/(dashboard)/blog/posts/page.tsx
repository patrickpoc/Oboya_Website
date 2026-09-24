"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import { sortBlogPostsForDisplay } from "@/lib/cms/repositories/blog-repository";
import { cn } from "@/lib/utils";

export default function BlogPostsPage() {
  const t = useTranslations("admin.blog.posts");
  const tCommon = useTranslations("admin.common");
  const [posts, setPosts] = useState<CmsBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = async () => {
    const res = await fetch("/api/cms/blog-posts?fields=list");
    if (!res.ok) throw new Error(tCommon("loadFailed"));
    const data = (await res.json()) as CmsBlogPost[];
    setPosts(sortBlogPostsForDisplay(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch {
        toast.error(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/cms/blog-posts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(tCommon("deleteFailed"));
      await load();
      toast.success(t("deleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("couldNotDelete"));
    }
  };

  const persistOrder = async (next: CmsBlogPost[]) => {
    setSavingOrder(true);
    try {
      const res = await fetch("/api/cms/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds: next.map((post) => post.id),
        }),
      });
      if (!res.ok) throw new Error(t("reorderFailed"));
      const payload = (await res.json()) as { posts?: CmsBlogPost[] };
      if (Array.isArray(payload.posts)) {
        setPosts(sortBlogPostsForDisplay(payload.posts));
      }
      toast.success(t("reorderSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reorderFailed"));
      await load();
    } finally {
      setSavingOrder(false);
    }
  };

  const movePost = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setPosts((current) => {
      const fromIndex = current.findIndex((post) => post.id === fromId);
      const toIndex = current.findIndex((post) => post.id === toId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      void persistOrder(next);
      return next;
    });
  };

  const orderedHint = useMemo(
    () => t("reorderHint"),
    [t]
  );

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href="/admin/blog/posts/new"
            className={buttonVariants({
              className: "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            {t("addPost")}
          </Link>
        }
      />
      {loading ? null : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{orderedHint}</p>
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-white">
            {posts.map((post) => (
              <li
                key={post.id}
                draggable
                onDragStart={() => setDraggingId(post.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingId) movePost(draggingId, post.id);
                  setDraggingId(null);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 transition-colors",
                  draggingId === post.id && "bg-oboya-blue-light/10",
                  savingOrder && "opacity-70"
                )}
              >
                <span
                  className="inline-flex cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-label={t("dragHandle", { title: post.title.en || post.slug })}
                >
                  <GripVertical className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-oboya-blue-dark">
                    {post.title.en || post.slug}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    /{post.slug}
                  </p>
                </div>
                <Badge variant={post.status === "published" ? "default" : "secondary"}>
                  {post.status}
                </Badge>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {post.publishedAt?.slice(0, 10) ?? "—"}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/blog/posts/${post.id}`}
                    className="inline-flex rounded p-1 hover:bg-muted"
                    aria-label={t("editAria", { title: post.title.en || post.slug })}
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(post.id)}
                    className="inline-flex rounded p-1 text-destructive hover:bg-muted"
                    aria-label={t("deleteAria", { title: post.title.en || post.slug })}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
