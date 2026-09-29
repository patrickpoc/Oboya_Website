"use client";

import { useTranslations } from "next-intl";
import { LeadsInbox } from "@/components/admin/leads/LeadsInbox";

export default function QuoteFormsPage() {
  const t = useTranslations("admin.forms.quotes");
  return <LeadsInbox type="quote" title={t("title")} description={t("description")} />;
}
