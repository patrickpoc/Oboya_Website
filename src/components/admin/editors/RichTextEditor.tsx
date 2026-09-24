"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FolderOpen,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  MediaLibraryDialog,
  type MediaLibraryItem,
} from "@/components/admin/media/MediaLibraryDialog";
import { uploadMediaFile } from "@/lib/cms/client/upload-media";
import { FOLDER_WEBSITE_FILES } from "@/lib/cms/media-folder-ids";
import {
  getMediaAssets,
  getMediaFolders,
  replaceMediaAssetsCache,
} from "@/lib/cms/repositories/media-repository";
import type { MediaAsset } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

const DEFAULT_SPECTRUM_COLOR = "#01203F";

type ImageAlign = "left" | "center" | "right";

function toHexColor(color: string | null | undefined): string | null {
  if (!color?.trim()) return null;
  const value = color.trim();
  if (/^#[0-9a-fA-F]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/i.test(value)) {
    const raw = value.slice(1);
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgb) return null;
  const toHex = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`.toLowerCase();
}

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isAcceptedImageFile(file: File) {
  return ACCEPTED_IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

function firstImageFile(list: FileList | File[] | null | undefined) {
  if (!list) return null;
  return Array.from(list).find(isAcceptedImageFile) ?? null;
}

const TEXT_COLORS = [
  { label: "Dark blue", value: "#01203F" },
  { label: "Main blue", value: "#004F7C" },
  { label: "Light blue", value: "#009CD4" },
  { label: "Green", value: "#4DAF4E" },
  { label: "Light green", value: "#75C566" },
  { label: "Orange", value: "#ea5744" },
  { label: "Dark yellow", value: "#909B03" },
  { label: "Black", value: "#111111" },
  { label: "Gray", value: "#4a6278" },
] as const;

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"] as const;

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-align": {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") ?? "center",
        renderHTML: (attributes) => ({
          "data-align": attributes["data-align"] ?? "center",
        }),
      },
    };
  },
}).configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: {
    class: "rich-text-image",
  },
  resize: {
    enabled: true,
    directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
    minWidth: 80,
    minHeight: 80,
    alwaysPreserveAspectRatio: true,
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

type ToolbarAction = {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  run: () => void;
};

function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "image");
  } catch {
    return "image";
  }
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const handleUploadRef = useRef<(file: File) => Promise<void>>(async () => {});
  const lastHtmlRef = useRef(value);
  const dragDepthRef = useRef(0);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTick, setLibraryTick] = useState(0);
  const [colorOpen, setColorOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [spectrumColor, setSpectrumColor] = useState(DEFAULT_SPECTRUM_COLOR);

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
      TextStyle,
      Color,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-oboya-blue-light underline underline-offset-2",
        },
      }),
      ResizableImage,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastHtmlRef.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "rich-text-editor prose prose-sm max-w-none min-h-[220px] rounded-b-lg border border-t-0 border-input px-3 py-2 focus:outline-none",
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const file = firstImageFile(event.dataTransfer?.files);
        if (!file) return false;
        event.preventDefault();
        void handleUploadRef.current(file);
        return true;
      },
      handlePaste: (view, event) => {
        const file = firstImageFile(event.clipboardData?.files);
        if (file) {
          event.preventDefault();
          void handleUploadRef.current(file);
          return true;
        }

        // Windows/Office HTML paste often includes huge base64 images and freezes
        // the editor + React state loop. Prefer plain text in that case.
        const html = event.clipboardData?.getData("text/html") ?? "";
        const plain = event.clipboardData?.getData("text/plain") ?? "";
        const tooHeavy =
          html.length > 200_000 || /src\s*=\s*["']data:image\//i.test(html);
        if (tooHeavy) {
          event.preventDefault();
          if (plain) {
            const { state, dispatch } = view;
            const { from, to } = state.selection;
            dispatch(state.tr.insertText(plain, from, to));
          }
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastHtmlRef.current) return;
    const current = editor.getHTML();
    if (value === current) {
      lastHtmlRef.current = value;
      return;
    }
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastHtmlRef.current = value || "";
  }, [editor, value]);

  useEffect(() => {
    if (!colorOpen && !imageMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (colorOpen && target && !colorPickerRef.current?.contains(target)) {
        setColorOpen(false);
      }
      if (imageMenuOpen && target && !imageMenuRef.current?.contains(target)) {
        setImageMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setColorOpen(false);
        setImageMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [colorOpen, imageMenuOpen]);

  const refreshLibrary = useCallback(async () => {
    try {
      const response = await fetch("/api/cms/media?limit=80&offset=0");
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
    (src: string, name: string) => {
      if (!editor) return;
      const alt = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      editor
        .chain()
        .focus()
        .setImage({
          src,
          alt,
          title: alt,
          "data-align": "center",
        } as never)
        .run();
    },
    [editor]
  );

  const handleUpload = useCallback(
    async (file: File) => {
      if (!isAcceptedImageFile(file)) {
        toast.error("Use JPEG, PNG, WebP, or GIF images.");
        return;
      }
      setUploading(true);
      try {
        const asset = await uploadMediaFile(file, { folder: FOLDER_WEBSITE_FILES });
        insertImage(asset.url, asset.name);
        void refreshLibrary();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Image upload failed");
      } finally {
        setUploading(false);
        setDragOver(false);
        dragDepthRef.current = 0;
      }
    },
    [insertImage, refreshLibrary]
  );

  useEffect(() => {
    handleUploadRef.current = handleUpload;
  }, [handleUpload]);

  const openMediaLibrary = useCallback(() => {
    setImageMenuOpen(false);
    void refreshLibrary().then(() => setLibraryOpen(true));
  }, [refreshLibrary]);

  const setImageAlign = useCallback(
    (align: ImageAlign) => {
      if (!editor) return;
      editor.chain().focus().updateAttributes("image", { "data-align": align }).run();
    },
    [editor]
  );

  const onEditorDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragOver(true);
  };

  const onEditorDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragOver(false);
  };

  const onEditorDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onEditorDrop = (event: DragEvent<HTMLDivElement>) => {
    const file = firstImageFile(event.dataTransfer.files);
    dragDepthRef.current = 0;
    setDragOver(false);
    if (!file) return;
    event.preventDefault();
    event.stopPropagation();
    void handleUpload(file);
  };

  if (!editor) {
    return (
      <div className={cn("min-h-[260px] rounded-lg border border-input bg-muted/20", className)} />
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt("URL", previous || "https://");
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const currentColor = (editor.getAttributes("textStyle").color as string | undefined) ?? "";
  const activeHex = toHexColor(currentColor);
  const toolbarSwatch = colorOpen ? spectrumColor : activeHex;
  const currentFontSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";
  const imageActive = editor.isActive("image");
  const imageAlign = (editor.getAttributes("image")["data-align"] as ImageAlign | undefined) ?? "center";

  const applyTextColor = (color: string) => {
    const hex = toHexColor(color) ?? color;
    setSpectrumColor(hex);
    editor.chain().focus().setColor(hex).run();
  };

  const clearTextColor = () => {
    setSpectrumColor(DEFAULT_SPECTRUM_COLOR);
    editor.chain().focus().unsetColor().run();
    setColorOpen(false);
  };

  const openColorPicker = () => {
    setImageMenuOpen(false);
    setSpectrumColor(activeHex ?? DEFAULT_SPECTRUM_COLOR);
    setColorOpen((open) => !open);
  };

  const actions: ToolbarAction[] = [
    {
      key: "undo",
      label: "Undo",
      icon: <Undo2 className="size-3.5" />,
      run: () => editor.chain().focus().undo().run(),
    },
    {
      key: "redo",
      label: "Redo",
      icon: <Redo2 className="size-3.5" />,
      run: () => editor.chain().focus().redo().run(),
    },
    {
      key: "bold",
      label: "Bold",
      icon: <Bold className="size-3.5" />,
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      label: "Italic",
      icon: <Italic className="size-3.5" />,
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: "underline",
      label: "Underline",
      icon: <UnderlineIcon className="size-3.5" />,
      active: editor.isActive("underline"),
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      key: "strike",
      label: "Strike",
      icon: <Strikethrough className="size-3.5" />,
      active: editor.isActive("strike"),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      key: "h2",
      label: "Heading 2",
      icon: <Heading2 className="size-3.5" />,
      active: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: "h3",
      label: "Heading 3",
      icon: <Heading3 className="size-3.5" />,
      active: editor.isActive("heading", { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      key: "align-left",
      label: "Align left",
      icon: <AlignLeft className="size-3.5" />,
      active: editor.isActive({ textAlign: "left" }),
      run: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      key: "align-center",
      label: "Align center",
      icon: <AlignCenter className="size-3.5" />,
      active: editor.isActive({ textAlign: "center" }),
      run: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      key: "align-right",
      label: "Align right",
      icon: <AlignRight className="size-3.5" />,
      active: editor.isActive({ textAlign: "right" }),
      run: () => editor.chain().focus().setTextAlign("right").run(),
    },
    {
      key: "bullet",
      label: "Bullet list",
      icon: <List className="size-3.5" />,
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: "ordered",
      label: "Ordered list",
      icon: <ListOrdered className="size-3.5" />,
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: "quote",
      label: "Quote",
      icon: <Quote className="size-3.5" />,
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      key: "hr",
      label: "Divider",
      icon: <Minus className="size-3.5" />,
      run: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      key: "link",
      label: "Link",
      icon: <Link2 className="size-3.5" />,
      active: editor.isActive("link"),
      run: setLink,
    },
  ];

  return (
    <div className={cn("space-y-0", className)}>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-input bg-oboya-soft-white/80 p-1.5">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            title={action.label}
            aria-label={action.label}
            aria-pressed={action.active}
            onClick={action.run}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md border text-oboya-blue-dark transition-colors",
              action.active
                ? "border-oboya-blue bg-oboya-blue/10 text-oboya-blue"
                : "border-transparent hover:border-border hover:bg-white"
            )}
          >
            {action.icon}
          </button>
        ))}

        <div className="relative" ref={imageMenuRef}>
          <button
            type="button"
            title="Insert image"
            aria-label="Insert image"
            aria-expanded={imageMenuOpen}
            aria-haspopup="menu"
            disabled={uploading}
            onClick={() => {
              setColorOpen(false);
              setImageMenuOpen((open) => !open);
            }}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md border text-oboya-blue-dark transition-colors",
              imageMenuOpen
                ? "border-oboya-blue bg-oboya-blue/10 text-oboya-blue"
                : "border-transparent hover:border-border hover:bg-white",
              uploading && "opacity-50"
            )}
          >
            <ImageIcon className="size-3.5" />
          </button>

          {imageMenuOpen ? (
            <div
              role="menu"
              aria-label="Insert image"
              className="absolute top-full left-0 z-30 mt-1 w-52 rounded-lg border border-border bg-white p-1.5 shadow-[var(--shadow-card)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setImageMenuOpen(false);
                  fileRef.current?.click();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-oboya-blue-dark hover:bg-oboya-soft-white"
              >
                <Upload className="size-3.5 shrink-0 text-oboya-blue" />
                From computer
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={openMediaLibrary}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-oboya-blue-dark hover:bg-oboya-soft-white"
              >
                <FolderOpen className="size-3.5 shrink-0 text-oboya-blue" />
                Media library
              </button>
              <p className="px-2.5 pt-1 pb-1.5 text-[10px] leading-snug text-muted-foreground">
                Or drag and drop an image into the editor
              </p>
            </div>
          ) : null}
        </div>

        <label className="sr-only" htmlFor="rich-text-font-size">
          Font size
        </label>
        <select
          id="rich-text-font-size"
          title="Font size"
          value={currentFontSize}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) {
              editor.chain().focus().unsetFontSize().run();
              return;
            }
            editor.chain().focus().setFontSize(next).run();
          }}
          className="h-8 rounded-md border border-transparent bg-transparent px-1.5 text-xs text-oboya-blue-dark hover:border-border hover:bg-white"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size.replace("px", "")}
            </option>
          ))}
        </select>

        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            title="Text color"
            aria-label="Text color"
            aria-expanded={colorOpen}
            aria-haspopup="dialog"
            onClick={openColorPicker}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md border text-oboya-blue-dark transition-colors",
              colorOpen || activeHex
                ? "border-oboya-blue bg-oboya-blue/10"
                : "border-transparent hover:border-border hover:bg-white"
            )}
          >
            <span
              className="size-4 rounded-full border border-black/15 shadow-sm"
              style={{
                background: toolbarSwatch
                  ? toolbarSwatch
                  : "conic-gradient(#ea5744, #DBE64C, #4DAF4E, #009CD4, #004F7C, #ea5744)",
              }}
            />
          </button>

          {colorOpen ? (
            <div
              role="dialog"
              aria-label="Text color"
              className="absolute top-full right-0 z-30 mt-1 w-56 rounded-lg border border-border bg-white p-2.5 shadow-[var(--shadow-card)]"
            >
              <label className="block space-y-1.5">
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Spectrum
                </span>
                <input
                  type="color"
                  value={spectrumColor}
                  onInput={(event) => applyTextColor(event.currentTarget.value)}
                  onChange={(event) => applyTextColor(event.currentTarget.value)}
                  className="h-10 w-full cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                />
              </label>

              <div className="mt-3 space-y-1.5">
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TEXT_COLORS.map((color) => {
                    const selected =
                      spectrumColor.toLowerCase() === color.value.toLowerCase() ||
                      activeHex?.toLowerCase() === color.value.toLowerCase();
                    return (
                      <button
                        key={color.value}
                        type="button"
                        title={color.label}
                        aria-label={color.label}
                        aria-pressed={selected}
                        onClick={() => {
                          applyTextColor(color.value);
                          setColorOpen(false);
                        }}
                        className={cn(
                          "size-5 rounded-full border border-black/10 transition-transform hover:scale-110",
                          selected && "ring-2 ring-oboya-blue ring-offset-1"
                        )}
                        style={{ backgroundColor: color.value }}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={clearTextColor}
                className="mt-2.5 w-full rounded-md border border-border px-2 py-1 text-xs text-oboya-blue-dark hover:bg-oboya-soft-white/80"
              >
                Reset
              </button>
            </div>
          ) : null}
        </div>

        {imageActive ? (
          <div className="flex items-center gap-0.5 border-l border-border/60 pl-1.5">
            <span className="px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Image
            </span>
            {(
              [
                ["left", AlignLeft],
                ["center", AlignCenter],
                ["right", AlignRight],
              ] as const
            ).map(([align, Icon]) => (
              <button
                key={align}
                type="button"
                title={`Image ${align}`}
                aria-label={`Image ${align}`}
                aria-pressed={imageAlign === align}
                onClick={() => setImageAlign(align)}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md border text-oboya-blue-dark transition-colors",
                  imageAlign === align
                    ? "border-oboya-blue bg-oboya-blue/10 text-oboya-blue"
                    : "border-transparent hover:border-border hover:bg-white"
                )}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="relative"
        onDragEnter={onEditorDragEnter}
        onDragLeave={onEditorDragLeave}
        onDragOver={onEditorDragOver}
        onDrop={onEditorDrop}
      >
        <EditorContent editor={editor} />
        {dragOver || uploading ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-b-lg border-2 border-dashed border-oboya-blue bg-oboya-blue/10",
              uploading && "border-solid"
            )}
          >
            <p className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-oboya-blue-dark shadow-sm">
              {uploading ? "Uploading image…" : "Drop image to insert"}
            </p>
          </div>
        ) : null}
      </div>

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

      {libraryOpen ? (
        <MediaLibraryDialog
          items={mediaLibraryImages}
          defaultFolderId={FOLDER_WEBSITE_FILES}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url, name) => {
            setLibraryOpen(false);
            insertImage(url, name || fileNameFromUrl(url));
          }}
        />
      ) : null}
    </div>
  );
}
