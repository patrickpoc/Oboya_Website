"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deleteBlogPost, getBlogPosts } from "@/lib/cms/repositories/blog-repository";

export default function BlogPostsPage() {
  const [posts, setPosts] = useState(getBlogPosts());

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    deleteBlogPost(id);
    setPosts(getBlogPosts());
    try {
      await fetch(`/api/cms/blog-posts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // in-memory fallback
    }
    toast.success("Post deleted");
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortable: true,
        cell: (row: (typeof posts)[0]) => row.title.en || row.slug,
      },
      { key: "author", header: "Author", cell: (row: (typeof posts)[0]) => row.author },
      {
        key: "status",
        header: "Status",
        cell: (row: (typeof posts)[0]) => (
          <Badge variant={row.status === "published" ? "default" : "secondary"}>
            {row.status}
          </Badge>
        ),
      },
      {
        key: "publishedAt",
        header: "Published",
        cell: (row: (typeof posts)[0]) => row.publishedAt?.slice(0, 10) ?? "—",
      },
      {
        key: "actions",
        header: "",
        cell: (row: (typeof posts)[0]) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/blog/posts/${row.id}`}
              className="inline-flex rounded p-1 hover:bg-muted"
              aria-label={`Edit ${row.title.en || row.slug}`}
            >
              <Pencil className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="inline-flex rounded p-1 text-destructive hover:bg-muted"
              aria-label={`Delete ${row.title.en || row.slug}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [posts]
  );

  return (
    <div>
      <AdminPageHeader
        title="Blog Posts"
        description="Create and manage articles shown on /news and /blog."
        actions={
          <Link
            href="/admin/blog/posts/new"
            className={buttonVariants({
              className: "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            New post
          </Link>
        }
      />
      <DataTable data={posts} columns={columns} searchKey="slug" />
    </div>
  );
}
