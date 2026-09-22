"use client";

import { Pipette } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EyeDropperResult = { sRGBHex: string };

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<EyeDropperResult>;
    };
  }
}

function normalizeHex(value: string, fallback: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

/**
 * Color + hex inputs with an EyeDropper that keeps page scroll free
 * so admins can sample from product images elsewhere on the form.
 */
export function ColorHexField({
  id,
  value,
  onChange,
  fallback = "#4DAF4E",
  placeholder = "#4DAF4E",
  className,
}: {
  id?: string;
  value: string;
  onChange: (hex: string) => void;
  fallback?: string;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("admin.products.editor");
  const hex = normalizeHex(value, fallback);

  const pickFromScreen = () => {
    void (async () => {
      if (typeof window.EyeDropper !== "function") {
        toast.error(t("eyedropperUnsupported"));
        return;
      }

      // Clear overflow locks on html/body while sampling so the page stays scrollable.
      const html = document.documentElement;
      const body = document.body;
      const prevHtml = html.style.overflow;
      const prevBody = body.style.overflow;
      html.style.overflow = "";
      body.style.overflow = "";

      try {
        const result = await new window.EyeDropper().open();
        const next = result.sRGBHex?.trim();
        if (next) onChange(next);
      } catch {
        // User cancelled the eyedropper.
      } finally {
        html.style.overflow = prevHtml;
        body.style.overflow = prevBody;
      }
    })();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        id={id}
        type="color"
        value={hex}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-12 shrink-0 cursor-pointer p-1"
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-8 min-w-0 flex-1"
        aria-label={t("colorHex")}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 shrink-0"
        onClick={pickFromScreen}
        aria-label={t("pickColor")}
        title={t("pickColorTitle")}
      >
        <Pipette className="size-3.5" />
      </Button>
    </div>
  );
}
