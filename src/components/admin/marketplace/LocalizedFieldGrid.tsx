"use client";

import { CMS_LOCALES } from "@/contexts/AdminContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

interface LocalizedFieldGridProps {
  label: string;
  value: LocalizedString;
  onChange: (locale: CmsLocale, nextValue: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

export function LocalizedFieldGrid({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
}: LocalizedFieldGridProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        {CMS_LOCALES.map((loc) => {
          const fieldId = `${label}-${loc.value}`.replace(/\s+/g, "-").toLowerCase();
          return (
            <div key={loc.value} className="space-y-1.5">
              <Label htmlFor={fieldId} className="text-xs text-muted-foreground">
                {loc.label}
              </Label>
              {multiline ? (
                <Textarea
                  id={fieldId}
                  rows={rows}
                  value={value[loc.value] ?? ""}
                  onChange={(e) => onChange(loc.value, e.target.value)}
                  placeholder={placeholder}
                />
              ) : (
                <Input
                  id={fieldId}
                  value={value[loc.value] ?? ""}
                  onChange={(e) => onChange(loc.value, e.target.value)}
                  placeholder={placeholder}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
