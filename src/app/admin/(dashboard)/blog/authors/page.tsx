"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import {
  getBlogAuthors,
  saveBlogAuthor,
  deleteBlogAuthor,
  type BlogAuthor,
} from "@/lib/cms/repositories/blog-authors-repository";

export default function BlogAuthorsPage() {
  const [authors, setAuthors] = useState(getBlogAuthors());
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo(
    () => authors.find((a) => a.id === editingId),
    [authors, editingId]
  );

  const handleSave = async (author: BlogAuthor) => {
    saveBlogAuthor(author);
    setAuthors(getBlogAuthors());
    try {
      await fetch("/api/cms/blog-authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(author),
      });
    } catch {
      // in-memory fallback
    }
    toast.success("Author saved");
    setEditingId(null);
  };

  const handleAdd = () => {
    const id = `author-${Date.now()}`;
    const author: BlogAuthor = {
      id,
      name: "",
      email: "",
    };
    saveBlogAuthor(author);
    setAuthors(getBlogAuthors());
    setEditingId(id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this author?")) return;
    deleteBlogAuthor(id);
    setAuthors(getBlogAuthors());
    try {
      await fetch(`/api/cms/blog-authors?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      // in-memory fallback
    }
    toast.success("Author deleted");
    if (editingId === id) setEditingId(null);
  };

  return (
    <Can module="blog" action="view" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <div>
        <AdminPageHeader
          title="Blog Authors"
          description="Authors appear in the post editor and on published articles."
          actions={
            <Button
              onClick={handleAdd}
              className="gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            >
              <Plus className="size-4" />
              New author
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="divide-y p-0">
              {authors.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No authors yet. Add one to get started.
                </p>
              ) : (
                authors.map((author) => (
                  <button
                    key={author.id}
                    type="button"
                    onClick={() => setEditingId(author.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{author.name || "Untitled author"}</span>
                    <span className="text-xs text-muted-foreground">{author.email}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {editing && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => {
                      const updated = { ...editing, name: e.target.value };
                      saveBlogAuthor(updated);
                      setAuthors(getBlogAuthors());
                      setEditingId(updated.id);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editing.email}
                    onChange={(e) => {
                      const updated = { ...editing, email: e.target.value };
                      saveBlogAuthor(updated);
                      setAuthors(getBlogAuthors());
                      setEditingId(updated.id);
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(editing)}
                    className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
                  >
                    Save author
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(editing.id)}
                    className="gap-1.5 rounded-full text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Can>
  );
}
