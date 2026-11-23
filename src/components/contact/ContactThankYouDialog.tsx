"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  InstagramIcon,
  LinkedInIcon,
} from "@/components/contact/ContactPageContent";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteConfig } from "@/constants/site";
import { cn } from "@/lib/utils";

const PILL =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue-light";

export function ContactThankYouDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("contact.thanks");
  const social = [
    {
      href: siteConfig.social.instagram,
      label: t("instagram"),
      Icon: InstagramIcon,
      className: "bg-oboya-blue-dark text-white hover:bg-oboya-blue",
    },
    {
      href: siteConfig.social.linkedin,
      label: t("linkedin"),
      Icon: LinkedInIcon,
      className: "bg-oboya-blue-dark text-white hover:bg-oboya-blue",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid gap-0 overflow-hidden rounded-sm bg-white p-0 text-oboya-blue-dark shadow-[var(--shadow-card)] ring-0 motion-reduce:animate-none sm:max-w-3xl sm:grid-cols-[42fr_58fr]"
      >
        <div className="relative h-44 sm:h-auto sm:min-h-[26rem]">
          <Image
            src="/assets/homepage/cta-flowers-field.jpg"
            alt=""
            fill
            sizes="(min-width: 640px) 320px, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/85 via-oboya-blue-dark/35 to-oboya-blue-dark/10"
          />
          <span
            aria-hidden
            className="absolute bottom-6 left-6 flex size-11 items-center justify-center rounded-full bg-oboya-green text-white ring-4 ring-white/20 sm:bottom-8 sm:left-8"
          >
            <Check className="size-5" strokeWidth={2.5} />
          </span>
        </div>

        <div className="flex flex-col justify-center gap-5 px-6 py-8 sm:px-10 sm:py-12 md:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-oboya-green">
            {t("eyebrow")}
          </p>
          <DialogTitle className="font-display text-[length:clamp(1.5rem,2.6vw,2rem)] font-light leading-[1.2] text-oboya-blue-dark">
            {t("title")}
          </DialogTitle>
          <span aria-hidden className="h-0.5 w-12 bg-oboya-orange" />
          <DialogDescription className="font-body text-base leading-relaxed text-oboya-blue-dark/80">
            {t("body")}
          </DialogDescription>

          <div className="mt-2 flex flex-col gap-3 border-t border-oboya-blue-dark/10 pt-6">
            <p className="text-sm font-semibold">{t("follow")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {social.map(({ href, label, Icon, className }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(PILL, className)}
                >
                  <Icon className="size-4" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <DialogClose
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-oboya-blue-dark shadow-[var(--shadow-subtle)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue-light"
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">{t("close")}</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
