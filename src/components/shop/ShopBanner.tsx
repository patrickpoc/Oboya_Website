"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/container";
import { useShop } from "@/contexts/ShopContext";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";
import { Link } from "@/i18n/navigation";

export function ShopBanner() {
  const locale = useLocale();
  const { shopConfig } = useShop();
  const banner = shopConfig.banner;

  if (!banner.enabled || !banner.imageUrl.trim()) return null;

  const title = pickLocalizedLabel(locale, "", banner.titleI18n).trim();
  const subtitle = pickLocalizedLabel(locale, "", banner.subtitleI18n).trim();
  const href = banner.href.trim();
  const isExternal = /^https?:\/\//i.test(href);
  const isInternal = href.startsWith("/");

  const content = (
    <div className="relative overflow-hidden rounded-xl bg-oboya-blue-dark">
      <div className="absolute inset-0">
        <Image
          src={banner.imageUrl}
          alt={title || "Shop banner"}
          fill
          className="object-cover opacity-80"
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-oboya-blue-dark/85 via-oboya-blue-dark/55 to-transparent" />
      </div>
      {(title || subtitle) && (
        <div className="relative z-10 flex min-h-[9rem] flex-col justify-center px-5 py-8 sm:min-h-[11rem] sm:px-8 md:px-10">
          {title ? (
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-2 max-w-lg text-sm text-white/90 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      )}
      {!title && !subtitle ? <div className="relative min-h-[9rem] sm:min-h-[11rem]" /> : null}
    </div>
  );

  return (
    <div className="border-b border-border/40 bg-oboya-soft-white/80 py-4 md:py-5">
      <Container size="wide">
        {href && isExternal ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        ) : href && isInternal ? (
          <Link href={href}>{content}</Link>
        ) : (
          content
        )}
      </Container>
    </div>
  );
}
