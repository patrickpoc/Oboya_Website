"use client";

import { useLocale } from "next-intl";
import { useCallback } from "react";
import { pickLocalized } from "@/lib/cms/utils";
import type { LocalizedString } from "@/lib/cms/types";
import { stripHtmlToPlainText } from "@/lib/cms/sanitize-rich-html";

type LocalizedDescription = Partial<Record<"en" | "pt-BR" | "es" | "zh-CN", string>>;

function pickDescriptionHtml(value: LocalizedDescription, locale: string) {
  const full: LocalizedString = {
    en: value.en ?? "",
    "pt-BR": value["pt-BR"] ?? "",
    es: value.es ?? "",
    "zh-CN": value["zh-CN"] ?? "",
  };
  return pickLocalized(full, locale);
}

export function pickProductDescriptionHtml(
  description: LocalizedDescription | undefined,
  locale: string
) {
  if (!description) return "";
  const primary = pickDescriptionHtml(description, locale);
  if (primary.trim()) return primary;
  return pickDescriptionHtml(description, "en");
}

export function pickProductShortDescription(
  shortDescription: LocalizedDescription | undefined,
  locale: string
) {
  if (!shortDescription) return "";
  const full: LocalizedString = {
    en: shortDescription.en ?? "",
    "pt-BR": shortDescription["pt-BR"] ?? "",
    es: shortDescription.es ?? "",
    "zh-CN": shortDescription["zh-CN"] ?? "",
  };
  const value = pickLocalized(full, locale) || pickLocalized(full, "en");
  return value.trim();
}

export function excerptFromDescriptionHtml(html: string, maxLength = 220) {
  const plain = stripHtmlToPlainText(html);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}

export function useProductDescription() {
  const locale = useLocale();

  const getDescriptionHtml = useCallback(
    (description?: LocalizedDescription) => pickProductDescriptionHtml(description, locale),
    [locale]
  );

  const getShortDescription = useCallback(
    (shortDescription?: LocalizedDescription) =>
      pickProductShortDescription(shortDescription, locale),
    [locale]
  );

  const getExcerpt = useCallback(
    (params: { shortDescription?: LocalizedDescription; description?: LocalizedDescription }) => {
      const short = getShortDescription(params.shortDescription);
      if (short) return short;
      const html = getDescriptionHtml(params.description);
      return excerptFromDescriptionHtml(html);
    },
    [getDescriptionHtml, getShortDescription]
  );

  return { getDescriptionHtml, getShortDescription, getExcerpt, locale };
}
