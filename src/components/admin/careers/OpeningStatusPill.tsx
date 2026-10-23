"use client";

import { useTranslations } from "next-intl";
import { StatusPill, type PillTone } from "@/components/admin/common";
import type { OpeningStatus } from "@/lib/cms/careers/types";

const TONES: Record<OpeningStatus, PillTone> = {
  draft: "warning",
  published: "success",
  closed: "neutral",
  archived: "muted",
};

export function OpeningStatusPill({ status }: { status: OpeningStatus }) {
  const t = useTranslations("admin.careers.common.status");
  return <StatusPill tone={TONES[status]}>{t(status)}</StatusPill>;
}
