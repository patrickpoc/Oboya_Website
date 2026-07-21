"use client";

import type { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export type HomepageSectionEditorProps = {
  settings: HomepageSettings;
  setSettings: Dispatch<SetStateAction<HomepageSettings>>;
  locale: CmsLocale;
};

export function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}`;
}

export const emptyLocalized = (): LocalizedString => ({
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
});

export function updateLocalizedField(
  value: LocalizedString,
  locale: CmsLocale,
  next: string
): LocalizedString {
  return { ...value, [locale]: next };
}

export function updateSettingsLocalized(
  setSettings: Dispatch<SetStateAction<HomepageSettings>>,
  path: keyof HomepageSettings,
  field: string,
  loc: CmsLocale,
  value: string
) {
  setSettings((prev) => {
    const section = prev[path] as Record<string, unknown>;
    const localized = section[field] as Record<CmsLocale, string>;
    return {
      ...prev,
      [path]: {
        ...section,
        [field]: { ...localized, [loc]: value },
      },
    };
  });
}

export function LocalizedInput({
  label,
  value,
  locale,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  locale: CmsLocale;
  onChange: (locale: CmsLocale, value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(locale, e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input px-3 py-2 text-sm"
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(locale, e.target.value)} />
      )}
    </div>
  );
}
