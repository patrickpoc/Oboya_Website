"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import type { CmsLocale } from "@/lib/cms/types";
import enMessages from "@/../messages/en.json";
import ptBRMessages from "@/../messages/pt-BR.json";
import esMessages from "@/../messages/es.json";
import zhCNMessages from "@/../messages/zh-CN.json";

const STORAGE_KEY = "oboya-admin-locale";

const ADMIN_LOCALES: CmsLocale[] = ["en", "pt-BR", "es", "zh-CN"];

const MESSAGE_CATALOG: Record<CmsLocale, AbstractIntlMessages> = {
  en: enMessages as unknown as AbstractIntlMessages,
  "pt-BR": ptBRMessages as unknown as AbstractIntlMessages,
  es: esMessages as unknown as AbstractIntlMessages,
  "zh-CN": zhCNMessages as unknown as AbstractIntlMessages,
};

export const ADMIN_LOCALE_SHORT: Record<CmsLocale, string> = {
  en: "en",
  "pt-BR": "pt",
  es: "es",
  "zh-CN": "zh",
};

export const ADMIN_LOCALE_OPTIONS: { value: CmsLocale; label: string; short: string }[] =
  [
    { value: "en", label: "English", short: "en" },
    { value: "pt-BR", label: "Português", short: "pt" },
    { value: "es", label: "Español", short: "es" },
    { value: "zh-CN", label: "中文", short: "zh" },
  ];

interface AdminLocaleContextValue {
  locale: CmsLocale;
  setLocale: (locale: CmsLocale) => void;
}

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

function isCmsLocale(value: string | null): value is CmsLocale {
  return Boolean(value && ADMIN_LOCALES.includes(value as CmsLocale));
}

export function AdminIntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<CmsLocale>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isCmsLocale(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((next: CmsLocale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  // Avoid flashing the wrong language before localStorage is read.
  const activeLocale = hydrated ? locale : "en";

  return (
    <AdminLocaleContext.Provider value={value}>
      <NextIntlClientProvider
        key={activeLocale}
        locale={activeLocale}
        messages={MESSAGE_CATALOG[activeLocale]}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const ctx = useContext(AdminLocaleContext);
  if (!ctx) {
    throw new Error("useAdminLocale must be used within AdminIntlProvider");
  }
  return ctx;
}
