"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteConfig } from "@/constants/site";

export function ContactThankYouDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("contact.thanks");
  const social = [
    { href: siteConfig.social.instagram, label: t("instagram") },
    { href: siteConfig.social.linkedin, label: t("linkedin") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-8 text-center sm:max-w-md">
        <DialogHeader className="items-center">
          <DialogTitle className="font-display text-2xl font-semibold text-oboya-blue-dark">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-base text-oboya-blue-dark/80">
            {t("body")}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm font-semibold text-oboya-blue-dark">{t("follow")}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {social.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-oboya-blue-dark px-6 text-sm font-semibold text-oboya-blue-dark transition-colors hover:bg-oboya-blue-dark hover:text-white"
            >
              {s.label}
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
