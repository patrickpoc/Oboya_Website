"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderInput,
  FolderPlus,
  Pencil,
  Search,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { uploadMediaFile } from "@/lib/cms/client/upload-media";
import {
  getMediaAssets,
  getMediaFolders,
  getChildFolders,
  getFolderBreadcrumb,
  createMediaFolder,
  renameMediaFolder,
  moveMediaFolder,
  searchMediaAssets,
  getAllTags,
  updateAssetTags,
  saveMediaAsset,
  deleteMediaAsset,
} from "@/lib/cms/repositories/media-repository";
import type { MediaAsset, MediaFolder } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function TagBadge({
  tag,
  active,
  onClick,
}: {
  tag: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-oboya-green bg-oboya-green/10 text-oboya-green"
          : "border-border text-muted-foreground hover:border-oboya-green/40 hover:text-oboya-blue-dark"
      )}
    >
      <Tag className="size-3" />
      {tag}
    </button>
  );
}

function AssetTagEditor({
  asset,
  allTags,
  onSave,
  onClose,
}: {
  asset: MediaAsset;
  allTags: string[];
  onSave: (tags: string[]) => void;
  onClose: () => void;
}) {
  const [tags, setTags] = useState<string[]>([...asset.tags]);
  const [newTag, setNewTag] = useState("");

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-oboya-blue-dark/30">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-oboya-blue-dark">
            Edit Tags — {asset.name}
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-oboya-green/10 px-2.5 py-1 text-[11px] font-medium text-oboya-green"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                <X className="size-3" />
              </button>
            </span>
          ))}
          {tags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags yet</p>
          )}
        </div>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTag(newTag); }
            }}
            placeholder="Add new tag..."
            className="h-8 flex-1 rounded-lg border border-border px-3 text-sm focus:border-oboya-green focus:outline-none"
          />
          <button
            type="button"
            onClick={() => addTag(newTag)}
            disabled={!newTag.trim()}
            className={buttonVariants({ size: "sm", className: "h-8 rounded-lg bg-oboya-green text-white hover:bg-oboya-green/90" })}
          >
            Add
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground uppercase">Existing tags</p>
            <div className="flex flex-wrap gap-1">
              {allTags.filter((t) => !tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-oboya-green/40 hover:text-oboya-green"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-lg" })}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onSave(tags); onClose(); }}
            className={buttonVariants({ size: "sm", className: "rounded-lg bg-oboya-green text-white hover:bg-oboya-green/90" })}
          >
            Save Tags
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderContextMenu({
  x,
  y,
  onRename,
  onMoveTo,
  onClose,
}: {
  x: number;
  y: number;
  onRename: () => void;
  onMoveTo: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 min-w-[160px] rounded-lg border border-border/60 bg-white py-1 shadow-xl"
        style={{ top: y, left: x }}
      >
        <button
          type="button"
          onClick={() => { onRename(); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-oboya-blue-dark hover:bg-muted"
        >
          <Pencil className="size-3.5" />
          Rename
        </button>
        <button
          type="button"
          onClick={() => { onMoveTo(); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-oboya-blue-dark hover:bg-muted"
        >
          <FolderInput className="size-3.5" />
          Move to...
        </button>
      </div>
    </>
  );
}

function RenameFolderDialog({
  currentName,
  onConfirm,
  onClose,
}: {
  currentName: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-oboya-blue-dark/30">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="mb-4 text-sm font-semibold text-oboya-blue-dark">Rename Folder</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onConfirm(name.trim()); onClose(); } }}
          placeholder="Folder name..."
          className="mb-4 h-9 w-full rounded-lg border border-border px-3 text-sm focus:border-oboya-green focus:outline-none"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-lg" })}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim() || name.trim() === currentName}
            onClick={() => { onConfirm(name.trim()); onClose(); }}
            className={buttonVariants({ size: "sm", className: "rounded-lg bg-oboya-green text-white hover:bg-oboya-green/90" })}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}

function MoveToDialog({
  folderId,
  onConfirm,
  onClose,
}: {
  folderId: string;
  onConfirm: (targetId: string) => void;
  onClose: () => void;
}) {
  const allFolders = getMediaFolders();
  const targets = allFolders.filter((f) => f.id !== folderId);

  const getPath = (folder: MediaFolder): string => {
    const parts: string[] = [];
    let current: MediaFolder | undefined = folder;
    while (current) {
      parts.unshift(current.name);
      current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined;
    }
    return parts.join(" / ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-oboya-blue-dark/30">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="mb-1 text-sm font-semibold text-oboya-blue-dark">Move Folder</h3>
        <p className="mb-4 text-xs text-muted-foreground">Select the destination folder</p>
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {targets.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => { onConfirm(folder.id); onClose(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-oboya-blue-dark transition-colors hover:bg-oboya-green/10"
            >
              <Folder className="size-4 shrink-0 text-oboya-green" />
              <span className="truncate">{getPath(folder)}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-lg" })}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function NewFolderDialog({
  onConfirm,
  onClose,
}: {
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-oboya-blue-dark/30">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="mb-4 text-sm font-semibold text-oboya-blue-dark">New Folder</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onConfirm(name.trim()); onClose(); } }}
          placeholder="Folder name..."
          className="mb-4 h-9 w-full rounded-lg border border-border px-3 text-sm focus:border-oboya-green focus:outline-none"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-lg" })}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => { onConfirm(name.trim()); onClose(); }}
            className={buttonVariants({ size: "sm", className: "rounded-lg bg-oboya-green text-white hover:bg-oboya-green/90" })}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string>("folder-root");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "document" | "video">("all");
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<MediaFolder | null>(null);
  const [movingFolder, setMovingFolder] = useState<MediaFolder | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    let failed = 0;
    try {
      for (const file of Array.from(files)) {
        try {
          const asset = await uploadMediaFile(file, {
            folder: currentFolderId,
          });
          saveMediaAsset(asset);
          ok += 1;
        } catch (error) {
          failed += 1;
          toast.error(
            error instanceof Error
              ? `${file.name}: ${error.message}`
              : `${file.name}: upload failed`
          );
        }
      }
      if (ok > 0) {
        refresh();
        toast.success(
          ok === 1 ? "1 file uploaded" : `${ok} files uploaded`
        );
      }
      if (failed > 0 && ok === 0) {
        // Errors already toasted per file.
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const allTags = useMemo(() => getAllTags(), [refreshKey]);
  const breadcrumb = useMemo(() => getFolderBreadcrumb(currentFolderId), [currentFolderId, refreshKey]);
  const childFolders = useMemo(() => getChildFolders(currentFolderId), [currentFolderId, refreshKey]);

  const isSearching = searchQuery.trim().length > 0 || selectedTags.length > 0;

  const assets = useMemo(() => {
    let results: MediaAsset[];
    if (isSearching) {
      results = searchMediaAssets(searchQuery, selectedTags.length > 0 ? selectedTags : undefined);
    } else {
      results = getMediaAssets(currentFolderId);
    }
    if (typeFilter !== "all") {
      results = results.filter((a) => a.type === typeFilter);
    }
    return results;
  }, [currentFolderId, searchQuery, selectedTags, typeFilter, refreshKey, isSearching]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreateFolder = (name: string) => {
    createMediaFolder(name, currentFolderId);
    refresh();
  };

  const handleRenameFolder = (id: string, name: string) => {
    renameMediaFolder(id, name);
    refresh();
  };

  const handleMoveFolder = (id: string, targetId: string) => {
    moveMediaFolder(id, targetId);
    refresh();
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: MediaFolder) => {
    e.preventDefault();
    setContextMenu({ folderId: folder.id, x: e.clientX, y: e.clientY });
  };

  const handleSaveTags = (asset: MediaAsset, tags: string[]) => {
    updateAssetTags(asset.id, tags);
    refresh();
  };

  const handleDeleteAsset = async (asset: MediaAsset) => {
    const confirmed = window.confirm(`Remove “${asset.name}”? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const params = new URLSearchParams({ id: asset.id, url: asset.url });
      const res = await fetch(`/api/cms/media?${params.toString()}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Delete failed");
      }
      deleteMediaAsset(asset.id);
      refresh();
      toast.success("File removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove file");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Media Library"
        description="Centralized storage for images, documents and videos."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewFolder(true)}
              className={buttonVariants({ variant: "outline", className: "gap-1.5 rounded-full" })}
            >
              <FolderPlus className="size-4" />
              New Folder
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              multiple
              className="hidden"
              onChange={(e) => {
                void handleUploadFiles(e.target.files);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className={buttonVariants({ className: "gap-1.5 rounded-full" })}
            >
              <Upload className="size-4" />
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        }
      />

      {/* Search bar */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, tag or file type..."
            className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-oboya-green focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="mb-3 flex gap-1.5">
        {(["all", "image", "document", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              typeFilter === t
                ? "bg-oboya-blue-dark text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t === "all" ? "All Types" : `${t}s`}
          </button>
        ))}
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium text-muted-foreground uppercase">Tags:</span>
          {allTags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              active={selectedTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="ml-1 text-[11px] text-muted-foreground hover:text-oboya-blue-dark"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      {!isSearching && (
        <nav className="mb-4 flex items-center gap-1 text-sm">
          {breadcrumb.map((folder, i) => (
            <span key={folder.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
              <button
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className={cn(
                  "rounded px-1.5 py-0.5 transition-colors hover:bg-muted",
                  i === breadcrumb.length - 1
                    ? "font-semibold text-oboya-blue-dark"
                    : "text-muted-foreground"
                )}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </nav>
      )}

      {isSearching && (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing {assets.length} result{assets.length !== 1 ? "s" : ""}
          {searchQuery && <> for &quot;{searchQuery}&quot;</>}
          {selectedTags.length > 0 && <> with tags: {selectedTags.join(", ")}</>}
        </p>
      )}

      {/* Folders */}
      {!isSearching && childFolders.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {childFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setCurrentFolderId(folder.id)}
              onContextMenu={(e) => handleFolderContextMenu(e, folder)}
              className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-oboya-green/30 hover:shadow-md"
            >
              <Folder className="size-5 shrink-0 text-oboya-green" />
              <span className="truncate text-sm font-medium text-oboya-blue-dark">
                {folder.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Assets grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="group relative overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {asset.type === "image" ? (
                <Image src={asset.url} alt={asset.name} fill className="object-cover" unoptimized />
              ) : asset.type === "video" ? (
                <video
                  src={`${asset.url}${asset.url.includes("#") ? "" : "#t=0.1"}`}
                  className="absolute inset-0 size-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <FileText className="size-8" />
                  <span className="text-xs">{asset.mimeType}</span>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className="truncate text-sm font-medium text-oboya-blue-dark">{asset.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge variant="secondary" className="text-[10px]">{asset.type}</Badge>
                <span className="text-[10px] text-muted-foreground">
                  {asset.size >= 1048576
                    ? `${(asset.size / 1048576).toFixed(1)} MB`
                    : `${(asset.size / 1024).toFixed(0)} KB`}
                </span>
                {asset.width && asset.height && (
                  <span className="text-[10px] text-muted-foreground">
                    {asset.width} × {asset.height}px
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{asset.mimeType}</span>
              </div>
              {asset.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-oboya-green/10 px-2 py-0.5 text-[10px] font-medium text-oboya-green"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(asset)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-oboya-green"
                >
                  <Tag className="size-3" />
                  Edit Tags
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAsset(asset)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                  aria-label={`Remove ${asset.name}`}
                  title="Remove file"
                >
                  <X className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-oboya-blue-dark">No files found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isSearching ? "Try adjusting your search or filters" : "This folder is empty"}
          </p>
        </div>
      )}

      {/* Dialogs */}
      {editingAsset && (
        <AssetTagEditor
          asset={editingAsset}
          allTags={allTags}
          onSave={(tags) => handleSaveTags(editingAsset, tags)}
          onClose={() => setEditingAsset(null)}
        />
      )}
      {showNewFolder && (
        <NewFolderDialog
          onConfirm={handleCreateFolder}
          onClose={() => setShowNewFolder(false)}
        />
      )}
      {contextMenu && (
        <FolderContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={() => {
            const folder = getMediaFolders().find((f) => f.id === contextMenu.folderId);
            if (folder) setRenamingFolder(folder);
          }}
          onMoveTo={() => {
            const folder = getMediaFolders().find((f) => f.id === contextMenu.folderId);
            if (folder) setMovingFolder(folder);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      {renamingFolder && (
        <RenameFolderDialog
          currentName={renamingFolder.name}
          onConfirm={(name) => handleRenameFolder(renamingFolder.id, name)}
          onClose={() => setRenamingFolder(null)}
        />
      )}
      {movingFolder && (
        <MoveToDialog
          folderId={movingFolder.id}
          onConfirm={(targetId) => handleMoveFolder(movingFolder.id, targetId)}
          onClose={() => setMovingFolder(null)}
        />
      )}
    </div>
  );
}
