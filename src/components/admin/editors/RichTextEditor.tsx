"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] rounded-lg border border-input px-3 py-2 focus:outline-none",
      },
    },
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1">
        {(
          [
            ["bold", "B"],
            ["italic", "I"],
            ["strike", "S"],
            ["heading", "H2"],
            ["bulletList", "• List"],
            ["orderedList", "1. List"],
          ] as const
        ).map(([cmd, label]) => (
          <button
            key={cmd}
            type="button"
            onClick={() => {
              if (!editor) return;
              const chain = editor.chain().focus();
              if (cmd === "heading") chain.toggleHeading({ level: 2 }).run();
              else if (cmd === "bulletList") chain.toggleBulletList().run();
              else if (cmd === "orderedList") chain.toggleOrderedList().run();
              else if (cmd === "bold") chain.toggleBold().run();
              else if (cmd === "italic") chain.toggleItalic().run();
              else if (cmd === "strike") chain.toggleStrike().run();
            }}
            className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted"
          >
            {label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
