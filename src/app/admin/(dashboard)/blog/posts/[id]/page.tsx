"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { RichTextEditor } from "@/components/admin/editors/RichTextEditor";
import { LocaleFieldTabs, emptyLocalizedString } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getBlogPostById,
  saveBlogPost,
  blogAuthors,
  getBlogCategories,
  type CmsBlogPost,
} from "@/lib/cms/repositories/blog-repository";
import type { CmsLocale, CmsStatus } from "@/lib/cms/types";

export default function BlogPostEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";
  const categories = getBlogCategories();

  const [post, setPost] = useState<CmsBlogPost>(() => {
    if (isNew) {
      return {
        id: `post-${Date.now()}`,
        slug: "",
        title: emptyLocalizedString(),
        excerpt: emptyLocalizedString(),
        body: emptyLocalizedString(),
        author: blogAuthors[0].name,
        categoryId: categories[0]?.id ?? "general",
        featuredImage: "",
        relatedPostIds: [],
        status: "draft",
        seo: { title: emptyLocalizedString(), description: emptyLocalizedString() },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return getBlogPostById(id)!;
  });
  const [locale, setLocale] = useState<CmsLocale>("en");

  if (!post) {
    return <p>Post not found</p>;
  }

  const handleSave = () => {
    saveBlogPost(post);
    toast.success("Post saved");
    router.push("/admin/blog/posts");
  };

  return (
    <div>
      <AdminPageHeader
        title={isNew ? "New post" : post.title.en || post.slug}
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/blog/posts"
              className={buttonVariants({ variant: "outline", className: "rounded-full" })}
            >
              Back
            </Link>
            <Button
              onClick={handleSave}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
              Save post
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <LocaleFieldTabs value={locale} onChange={setLocale}>
                {(loc) => (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={post.title[loc]}
                        onChange={(e) =>
                          setPost({
                            ...post,
                            title: { ...post.title, [loc]: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Excerpt</Label>
                      <textarea
                        value={post.excerpt[loc]}
                        onChange={(e) =>
                          setPost({
                            ...post,
                            excerpt: { ...post.excerpt, [loc]: e.target.value },
                          })
                        }
                        rows={3}
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Body</Label>
                      <RichTextEditor
                        value={post.body[loc]}
                        onChange={(html) =>
                          setPost({
                            ...post,
                            body: { ...post.body, [loc]: html },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </LocaleFieldTabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={post.slug}
                  onChange={(e) => setPost({ ...post, slug: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={post.status}
                  onChange={(e) =>
                    setPost({ ...post, status: e.target.value as CmsStatus })
                  }
                  className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Schedule publish</Label>
                <Input
                  type="datetime-local"
                  value={post.scheduledAt?.slice(0, 16) ?? ""}
                  onChange={(e) =>
                    setPost({
                      ...post,
                      scheduledAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Published date</Label>
                <Input
                  type="date"
                  value={post.publishedAt?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    setPost({
                      ...post,
                      publishedAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Featured image URL</Label>
                <Input
                  value={post.featuredImage ?? ""}
                  onChange={(e) => setPost({ ...post, featuredImage: e.target.value })}
                  placeholder="/assets/homepage/greenhouse-technology.webp"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Author</Label>
                <select
                  value={post.author}
                  onChange={(e) => setPost({ ...post, author: e.target.value })}
                  className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
                >
                  {blogAuthors.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  value={post.categoryId}
                  onChange={(e) => setPost({ ...post, categoryId: e.target.value })}
                  className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.en}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
