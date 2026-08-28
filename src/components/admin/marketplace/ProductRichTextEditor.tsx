"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import {
  MediaLibraryDialog,
  type MediaLibraryItem,
} from "@/components/admin/media/MediaLibraryDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMediaFile } from "@/lib/cms/client/upload-media";
import { FOLDER_PRODUCT_DESCRIPTIONS } from "@/lib/cms/media-folder-ids";
import {
  getMediaAssets,
  getMediaFolders,
  replaceMediaAssetsCache,
} from "@/lib/cms/repositories/media-repository";
import type { MediaAsset } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

const ProductImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-align": {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") ?? "center",
        renderHTML: (attributes) => ({
          "data-align": attributes["data-align"] ?? "center",
          class: "product-description-image",
        }),
      },
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("alt") ?? "",
        renderHTML: (attributes) => ({
          alt: attributes.alt ?? "",
        }),
      },
    };
  },
});

interface ProductRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "image");
  } catch {
    return "image";
  }
}

export function ProductRichTextEditor({
  value,
  onChange,
  className,
  placeholder,
}: ProductRichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTick, setLibraryTick] = useState(0);
  const [pendingImage, setPendingImage] = useState<{ src: string; name: string } | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [alignDraft, setAlignDraft] = useState<"left" | "center" | "right">("center");

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of getMediaFolders()) {
      map.set(folder.id, folder.name);
    }
    return map;
  }, []);

  const mediaLibraryImages = useMemo<MediaLibraryItem[]>(
    () =>
      getMediaAssets()
        .filter((asset) => asset.type === "image")
        .map((asset) => ({
          id: asset.id,
          name: asset.name,
          url: asset.url,
          type: asset.type,
          tags: asset.tags,
          folder: asset.folder,
          folderName: folderNameById.get(asset.folder),
        })),
    [folderNameById, libraryTick]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ProductImage.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "product-rich-editor prose prose-sm max-w-none min-h-[220px] rounded-lg border border-input px-3 py-2 focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const refreshLibrary = useCallback(async () => {
    try {
      const response = await fetch("/api/cms/media");
      if (!response.ok) return;
      const data = (await response.json()) as { assets?: MediaAsset[] };
      if (data.assets) {
        replaceMediaAssetsCache(data.assets);
        setLibraryTick((n) => n + 1);
      }
    } catch {
      // Keep local cache.
    }
  }, []);

  const insertImage = useCallback(
    (src: string, alt: string, align: "left" | "center" | "right") => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .setImage({
          src,
          alt,
          title: alt,
          "data-align": align,
        } as never)
        .run();
    },
    [editor]
  );

  const openImageDialog = useCallback((src: string, name: string) => {
    setPendingImage({ src, name });
    setAltDraft(name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
    setAlignDraft("center");
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const asset = await uploadMediaFile(file, { folder: FOLDER_PRODUCT_DESCRIPTIONS });
        openImageDialog(asset.url, asset.name);
        void refreshLibrary();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    },
    [openImageDialog, refreshLibrary]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  const toolbarButton = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    active = false
  ) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted",
        active && "bg-muted"
      )}
    >
      {icon}
    </button>
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1">
        {toolbarButton("Bold", <Bold className="size-3.5" />, () =>
          editor?.chain().focus().toggleBold().run()
        )}
        {toolbarButton("Italic", <Italic className="size-3.5" />, () =>
          editor?.chain().focus().toggleItalic().run()
        )}
        {toolbarButton("Underline", <span className="text-[11px] font-semibold underline">U</span>, () =>
          editor?.chain().focus().toggleUnderline().run()
        )}
        {toolbarButton("Heading 2", <Heading2 className="size-3.5" />, () =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run()
        )}
        {toolbarButton("Heading 3", <Heading3 className="size-3.5" />, () =>
          editor?.chain().focus().toggleHeading({ level: 3 }).run()
        )}
        {toolbarButton("Bullet list", <List className="size-3.5" />, () =>
          editor?.chain().focus().toggleBulletList().run()
        )}
        {toolbarButton("Ordered list", <ListOrdered className="size-3.5" />, () =>
          editor?.chain().focus().toggleOrderedList().run()
        )}
        {toolbarButton("Link", <Link2 className="size-3.5" />, setLink)}
        {toolbarButton("Horizontal rule", <Minus className="size-3.5" />, () =>
          editor?.chain().focus().setHorizontalRule().run()
        )}
        {toolbarButton("Insert image", <ImageIcon className="size-3.5" />, () =>
          fileRef.current?.click()
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 rounded border-border px-2 text-xs"
          onClick={() => {
            void refreshLibrary().then(() => setLibraryOpen(true));
          }}
        >
          <ImageIcon className="mr-1 size-3.5" />
          Library
        </Button>
        {toolbarButton("Undo", <Undo2 className="size-3.5" />, () =>
          editor?.chain().focus().undo().run()
        )}
        {toolbarButton("Redo", <Redo2 className="size-3.5" />, () =>
          editor?.chain().focus().redo().run()
        )}
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
          event.target.value = "";
        }}
      />

      {libraryOpen && (
        <MediaLibraryDialog
          items={mediaLibraryImages}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url, name) => {
            setLibraryOpen(false);
            openImageDialog(url, name || fileNameFromUrl(url));
          }}
        />
      )}

      {pendingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-oboya-blue-dark/40"
            aria-label="Close"
            onClick={() => setPendingImage(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border/60 bg-white p-5 shadow-2xl">
            <h4 className="font-semibold text-oboya-blue-dark">Insert image</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Add alt text for accessibility and SEO.
            </p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="image-alt">Alt text</Label>
                <Input
                  id="image-alt"
                  value={altDraft}
                  onChange={(event) => setAltDraft(event.target.value)}
                  placeholder="Describe the image"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="image-align">Alignment</Label>
                <select
                  id="image-align"
                  value={alignDraft}
                  onChange={(event) =>
                    setAlignDraft(event.target.value as "left" | "center" | "right")
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingImage(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-oboya-green hover:bg-oboya-green/90"
                onClick={() => {
                  insertImage(pendingImage.src, altDraft.trim(), alignDraft);
                  setPendingImage(null);
                }}
              >
                Insert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
