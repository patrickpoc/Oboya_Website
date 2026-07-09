"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CMS_LOCALES } from "@/contexts/AdminContext";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

interface LocaleFieldTabsProps {
  value: CmsLocale;
  onChange: (locale: CmsLocale) => void;
  children: (locale: CmsLocale) => React.ReactNode;
}

export function LocaleFieldTabs({ value, onChange, children }: LocaleFieldTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as CmsLocale)}>
      <TabsList>
        {CMS_LOCALES.map((loc) => (
          <TabsTrigger key={loc.value} value={loc.value}>
            {loc.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {CMS_LOCALES.map((loc) => (
        <TabsContent key={loc.value} value={loc.value}>
          {children(loc.value)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function emptyLocalizedString(): LocalizedString {
  return { en: "", "pt-BR": "", es: "", "zh-CN": "" };
}
