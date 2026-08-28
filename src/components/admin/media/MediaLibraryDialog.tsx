"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Tag, X } from "lucide-react";
import { VideoThumbnail } from "@/components/admin/media/VideoThumbnail";
import { Input } from "@/components/ui/input";
import { scoreMediaLibrarySearch } from "@/lib/cms/media-library-search";
import {
  FOLDER_ECOVASO_PRODUCTS,
  FOLDER_PRODUCTS,
  FOLDER_WEBSITE_FILES,
} from "@/lib/cms/media-folder-ids";
import { getMediaFolders } from "@/lib/cms/repositories/media-repository";
import type { MediaAsset } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

export type MediaLibraryItem = {
  id: string;
  name: string;
  url: string;
  type: MediaAsset["type"];
  tags?: string[];
  folder?: string;
  folderName?: string;
};

type MediaTypeFilter = "all" | MediaAsset["type"];

function itemFolderLabel(folderId: string) {
  if (folderId === FOLDER_ECOVASO_PRODUCTS) return "Ecovaso Products";
  if (folderId === FOLDER_PRODUCTS) return "Products";
  if (folderId === FOLDER_WEBSITE_FILES) return "Website Files";
  return folderId;
}

function FilterChipButton({
  label,
  active,
  onClick,
  showTagIcon = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  showTagIcon?: boolean;
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
      {showTagIcon ? <Tag className="size-3" /> : null}
      {label}
    </button>
  );
}

export function MediaLibraryDialog({
  items,
  selected,
  onSelect,
  onClose,
  defaultFolderId = FOLDER_ECOVASO_PRODUCTS,
}: {
  items: MediaLibraryItem[];
  selected?: string;
  onSelect: (url: string, name: string) => void;
  onClose: () => void;
  defaultFolderId?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | "all">(
    defaultFolderId || "all"
  );
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of getMediaFolders()) {
      map.set(folder.id, folder.name);
    }
    return map;
  }, []);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const tag of item.tags ?? []) {
        set.add(tag);
      }
    }
    return Array.from(set).sort();
  }, [items]);

  const folderOptions = useMemo(() => {
    const ids = new Set(items.map((item) => item.folder).filter(Boolean) as string[]);
    return Array.from(ids).sort((a, b) => {
      const nameA = folderNameById.get(a) ?? itemFolderLabel(a);
      const nameB = folderNameById.get(b) ?? itemFolderLabel(b);
      return nameA.localeCompare(nameB);
    });
  }, [items, folderNameById]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim();

    const scored = items
      .map((item) => {
        if (selectedFolder !== "all" && item.folder !== selectedFolder) {
          return null;
        }

        if (typeFilter !== "all" && item.type !== typeFilter) {
          return null;
        }

        if (
          selectedTags.length > 0 &&
          !selectedTags.some((tag) => (item.tags ?? []).includes(tag))
        ) {
          return null;
        }

        const score = scoreMediaLibrarySearch(q, [
          item.name,
          item.url,
          item.folderName ?? folderNameById.get(item.folder ?? "") ?? "",
          item.type,
          ...(item.tags ?? []),
        ]);

        if (score <= 0) return null;

        return { item, score };
      })
      .filter(Boolean) as Array<{ item: MediaLibraryItem; score: number }>;

    return scored.sort((a, b) => b.score - a.score);
  }, [items, searchQuery, selectedFolder, typeFilter, selectedTags, folderNameById]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-oboya-blue-dark/40 backdrop-blur-[2px]"
        aria-label="Close media library"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Media library"
        className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-2xl"
      >
        <div className="border-b border-border/60 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-oboya-blue-dark">
                Media library
              </h3>
              <p className="text-xs text-muted-foreground">
                Search by name or tag, then filter by folder and media type
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, tag or folder…"
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Folder:</span>
            <FilterChipButton
              label="All"
              active={selectedFolder === "all"}
              onClick={() => setSelectedFolder("all")}
            />
            {folderOptions.map((folderId) => (
              <FilterChipButton
                key={folderId}
                label={folderNameById.get(folderId) ?? itemFolderLabel(folderId)}
                active={selectedFolder === folderId}
                onClick={() => setSelectedFolder(folderId)}
              />
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Type:</span>
            {(["all", "image", "document", "video"] as const).map((type) => (
              <FilterChipButton
                key={type}
                label={type === "all" ? "All" : `${type}s`}
                active={typeFilter === type}
                onClick={() => setTypeFilter(type)}
              />
            ))}
          </div>

          {availableTags.length > 0 && (
            <div className="mt-2 flex max-h-24 flex-wrap items-center gap-1.5 overflow-y-auto">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Tags:</span>
              {availableTags.map((tag) => (
                <FilterChipButton
                  key={tag}
                  label={tag}
                  showTagIcon
                  active={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedTags([])}
                >
                  Clear tags
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-xs text-muted-foreground">
            {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}
            {searchQuery ? ` for "${searchQuery}"` : ""}
          </p>

          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching media found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredItems.map(({ item }) => {
                const active = selected === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.url, item.name)}
                    className={cn(
                      "overflow-hidden rounded-xl border bg-oboya-soft-white text-left transition-shadow hover:shadow-md",
                      active
                        ? "border-oboya-green ring-2 ring-oboya-green/40"
                        : "border-border/60"
                    )}
                  >
                    <div className="relative aspect-video bg-muted">
                      {item.type === "video" ? (
                        <VideoThumbnail src={item.url} />
                      ) : (
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="space-y-1 px-2 py-1.5">
                      <p className="truncate text-[11px] font-medium text-oboya-blue-dark">
                        {item.name}
                      </p>
                      {(item.tags ?? []).length > 0 && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {(item.tags ?? []).join(" · ")}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
