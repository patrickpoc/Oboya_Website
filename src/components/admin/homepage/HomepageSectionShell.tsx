"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import {
  getHomepageSettings,
  saveHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";
import {
  HOMEPAGE_SECTION_META,
  type HomepageSectionSlug,
} from "@/lib/cms/homepage-sections";
import type { CmsLocale } from "@/lib/cms/types";
import type { HomepageSectionEditorProps } from "./shared";

type HomepageSectionShellProps = {
  section: HomepageSectionSlug;
  children: (props: HomepageSectionEditorProps) => ReactNode;
};

export function HomepageSectionShell({ section, children }: HomepageSectionShellProps) {
  const meta = HOMEPAGE_SECTION_META[section];
  const [settings, setSettings] = useState<HomepageSettings>(getHomepageSettings());
  const [locale, setLocale] = useState<CmsLocale>("en");

  const handleSave = async () => {
    saveHomepageSettings(settings);
    try {
      await fetch("/api/cms/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch {
      // in-memory fallback
    }
    toast.success("Homepage saved");
  };

  return (
    <Can
      module="website"
      action="edit"
      fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}
    >
      <div>
        <Link
          href="/admin/website/home"
          className="mb-4 inline-flex text-sm text-muted-foreground transition-colors hover:text-oboya-blue-dark"
        >
          ← All homepage sections
        </Link>

        <AdminPageHeader
          title={meta.title}
          description={meta.description}
          actions={
            <Button
              onClick={handleSave}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
              Save
            </Button>
          }
        />

        <LocaleFieldTabs value={locale} onChange={setLocale}>
          {(loc) => children({ settings, setSettings, locale: loc })}
        </LocaleFieldTabs>
      </div>
    </Can>
  );
}
