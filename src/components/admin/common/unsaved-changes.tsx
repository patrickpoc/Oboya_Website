"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Warns before losing edits: browser reload/close (beforeunload) and clicks on
 * in-app links (captured before Next's Link handler runs).
 */
export function useUnsavedChangesGuard(dirty: boolean, message?: string) {
  const t = useTranslations("admin.common");
  const prompt = message ?? t("leaveUnsavedConfirm");

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      if (!window.confirm(prompt)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, prompt]);
}

/** Sticky footer bar shown only while there are pending edits. */
export function UnsavedChangesBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  saveLabel,
  disabled,
  className,
}: {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("admin.common");
  if (!dirty) return null;
  return (
    <div
      role="status"
      className={cn(
        "sticky bottom-4 z-30 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-oboya-orange/30 bg-white/95 px-4 py-3 shadow-lg backdrop-blur",
        className
      )}
    >
      <span className="size-2 rounded-full bg-oboya-orange" aria-hidden />
      <span className="flex-1 text-sm font-medium text-oboya-blue-dark">{t("unsavedChanges")}</span>
      {onDiscard ? (
        <Button type="button" variant="ghost" className="rounded-full" disabled={saving} onClick={onDiscard}>
          {t("discard")}
        </Button>
      ) : null}
      <Button
        type="button"
        className="rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90"
        disabled={saving || disabled}
        onClick={onSave}
      >
        {saving ? t("saving") : (saveLabel ?? t("save"))}
      </Button>
    </div>
  );
}

export function EditorGuard(props: {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
  disabled?: boolean;
}) {
  useUnsavedChangesGuard(props.dirty);
  return <UnsavedChangesBar {...props} />;
}
