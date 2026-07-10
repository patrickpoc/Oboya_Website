"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getBlogPosts } from "@/lib/cms/repositories/blog-repository";

export default function BlogPostsPage() {
  const [posts] = useState(getBlogPosts());

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortable: true,
        cell: (row: (typeof posts)[0]) => row.title.en,
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
        cell: (row: (typeof posts)[0]) => row.publishedAt ?? "—",
      },
      {
        key: "actions",
        header: "",
        cell: (row: (typeof posts)[0]) => (
          <Link
            href={`/admin/blog/posts/${row.id}`}
            className="inline-flex rounded p-1 hover:bg-muted"
          >
            <Pencil className="size-3.5" />
          </Link>
        ),
      },
    ],
    []
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
