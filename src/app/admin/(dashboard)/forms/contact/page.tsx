"use client";

import { useTranslations } from "next-intl";
import { LeadsInbox } from "@/components/admin/leads/LeadsInbox";

export default function ContactFormsPage() {
  const t = useTranslations("admin.forms.contact");
  return <LeadsInbox type="contact" title={t("title")} description={t("description")} />;
}
